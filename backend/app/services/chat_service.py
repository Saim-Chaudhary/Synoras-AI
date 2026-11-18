"""Chats and messages: the database work behind /chats (SRS FR-3, FR-4; SDD 5.2).

Every function takes the user's id and only ever touches that user's own chats (BR-1).
A chat that exists but belongs to somebody else is reported as "not found", exactly like a
chat that does not exist, so nobody can find out which chat ids are in use.
"""

from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import and_, delete, exists, or_, select
from sqlalchemy.orm import Session

from app.models.chat import DEFAULT_TITLE, Chat, Message, Subtask
from app.schemas.chat import MessageOut, RoutingOut

# How much of the conversation is sent to the model as context (FR-3). Free plans are small
# (Groq: 8K tokens a minute), so the history is capped by message count AND by size.
HISTORY_MAX_MESSAGES = 20
HISTORY_MAX_CHARS = 8000  # about 2000 tokens

SYSTEM_PROMPT = (
    "You are Synoras AI, a helpful and honest assistant. Answer clearly and concisely. "
    "Use Markdown for formatting, and put code in fenced code blocks with the language name."
)


class ChatError(Exception):
    """kind is one of: not_found, empty_message, nothing_to_do."""

    def __init__(self, kind: str, message: str):
        super().__init__(message)
        self.kind = kind
        self.message = message


def now() -> datetime:
    return datetime.now(timezone.utc)


# ---------- chats ----------


def own_chat(db: Session, user_id: int, chat_id: int) -> Chat:
    chat = db.scalar(select(Chat).where(Chat.chat_id == chat_id, Chat.user_id == user_id))
    if chat is None:
        raise ChatError("not_found", "Chat not found")
    return chat


def create_chat(db: Session, user_id: int, title: str | None = None) -> Chat:
    chat = Chat(user_id=user_id, title=title or DEFAULT_TITLE, created_at=now(), updated_at=now())
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return chat


def _like_pattern(text: str) -> str:
    """Make `text` safe to use inside LIKE: a typed % or _ must not act as a wildcard."""
    escaped = text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


def list_chats(db: Session, user_id: int, query: str | None = None, limit: int = 200) -> list[Chat]:
    """The user's chats, the most recently active first. With `query`, only chats whose
    title or any message contains it (capitals do not matter)."""
    statement = select(Chat).where(Chat.user_id == user_id)
    search = (query or "").strip()
    if search:
        pattern = _like_pattern(search)
        in_a_message = exists().where(
            Message.chat_id == Chat.chat_id, Message.text.ilike(pattern, escape="\\")
        )
        statement = statement.where(or_(Chat.title.ilike(pattern, escape="\\"), in_a_message))
    statement = statement.order_by(Chat.updated_at.desc(), Chat.chat_id.desc()).limit(limit)
    return list(db.scalars(statement))


def rename_chat(db: Session, user_id: int, chat_id: int, title: str) -> Chat:
    chat = own_chat(db, user_id, chat_id)
    chat.title = title
    db.commit()
    db.refresh(chat)
    return chat


def delete_chat(db: Session, user_id: int, chat_id: int) -> None:
    chat = own_chat(db, user_id, chat_id)
    db.delete(chat)  # the database removes its messages and routing log rows too (ON DELETE CASCADE)
    db.commit()


# ---------- messages ----------


def chat_messages(db: Session, chat_id: int) -> list[MessageOut]:
    """All messages of a chat, oldest first, each reply with its routing note."""
    rows = db.execute(
        select(Message, Subtask)
        .outerjoin(
            Subtask, and_(Subtask.message_id == Message.message_id, Subtask.kind == "reply")
        )
        .where(Message.chat_id == chat_id)
        .order_by(Message.message_id)
    ).all()
    result = []
    for message, subtask in rows:
        routing = None
        if subtask is not None:
            routing = RoutingOut(
                complexity=subtask.complexity,
                tier=subtask.tier,
                model=subtask.model_used,
                seconds=subtask.response_time,
                estimated_cost_usd=subtask.cost,
                note=subtask.note,
            )
        result.append(
            MessageOut(
                message_id=message.message_id,
                sender=message.sender,  # type: ignore[arg-type]
                text=message.text,
                model_used=message.model_used,
                created_at=message.created_at,
                routing=routing,
            )
        )
    return result


@dataclass(frozen=True)
class Turn:
    """Everything the stream needs, as plain values (no database objects), prepared BEFORE the
    stream starts. The user's message is already saved, so it is kept even if no model answers."""

    chat_id: int
    user_id: int
    user_message_id: int
    user_text: str
    prompt: list[dict]  # what is sent to the model: system prompt + recent history


def build_prompt(history: list[tuple[str, str]]) -> list[dict]:
    """history = (sender, text) pairs, oldest first, ending with the new user message."""
    recent = history[-HISTORY_MAX_MESSAGES:]
    # Too long? Drop the oldest messages first, but always keep the newest one.
    while len(recent) > 1 and sum(len(text) for _, text in recent) > HISTORY_MAX_CHARS:
        recent = recent[1:]
    # The model should see a conversation that starts with the user.
    while len(recent) > 1 and recent[0][0] == "assistant":
        recent = recent[1:]
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages += [
        {"role": "user" if sender == "user" else "assistant", "content": text}
        for sender, text in recent
    ]
    return messages


def prepare_turn(db: Session, user_id: int, chat: Chat, action: str, text: str | None) -> Turn:
    """Do everything that must happen before the answer is streamed, and save it.

    send        saves the new user message
    regenerate  deletes everything after the last user message (the last reply)
    edit        changes the last user message and deletes everything after it
    """
    cleaned = (text or "").strip()

    if action == "send":
        if not cleaned:
            raise ChatError("empty_message", "An empty message is not sent.")
        user_message = Message(chat_id=chat.chat_id, sender="user", text=cleaned)
        db.add(user_message)
        db.flush()
    else:
        user_message = db.scalar(
            select(Message)
            .where(Message.chat_id == chat.chat_id, Message.sender == "user")
            .order_by(Message.message_id.desc())
            .limit(1)
        )
        if user_message is None:
            raise ChatError("nothing_to_do", "There is no message to answer in this chat yet.")
        if action == "edit":
            if not cleaned:
                raise ChatError("empty_message", "An empty message is not sent.")
            user_message.text = cleaned
        db.execute(
            delete(Message).where(
                Message.chat_id == chat.chat_id, Message.message_id > user_message.message_id
            )
        )

    chat.updated_at = now()
    db.flush()

    newest_first = db.execute(
        select(Message.sender, Message.text)
        .where(Message.chat_id == chat.chat_id)
        .order_by(Message.message_id.desc())
        .limit(HISTORY_MAX_MESSAGES)
    ).all()
    history = [(sender, body) for sender, body in reversed(newest_first)]
    turn = Turn(
        chat_id=chat.chat_id,
        user_id=user_id,
        user_message_id=user_message.message_id,
        user_text=user_message.text,
        prompt=build_prompt(history),
    )
    db.commit()  # keep the user's message even if the model cannot answer (FR-3)
    return turn
