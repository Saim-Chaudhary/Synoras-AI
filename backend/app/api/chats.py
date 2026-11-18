"""/chats: create, list, open, rename, delete, search, and send a message (SRS FR-3, FR-4).

Every endpoint needs a login (get_current_user) and only sees the user's own chats (BR-1).
"""

from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.sse import EventSourceResponse, ServerSentEvent
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import Settings, get_settings
from app.db.session import get_db, get_session_factory
from app.models.user import User
from app.schemas.chat import ChatCreate, ChatDetail, ChatOut, ChatRename, SendMessage
from app.services import chat_service
from app.services.chat_service import ChatError, Turn
from app.services.chat_stream import SessionFactory, stream_reply
from app.services.event_pump import pump

router = APIRouter(prefix="/chats", tags=["chats"])

STATUS_FOR_KIND = {"not_found": 404, "empty_message": 422, "nothing_to_do": 409}


def http_error(error: ChatError) -> HTTPException:
    return HTTPException(status_code=STATUS_FOR_KIND[error.kind], detail=error.message)


@router.post("", response_model=ChatOut, status_code=201)
def create_chat(
    body: ChatCreate | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Start a new, empty chat."""
    return chat_service.create_chat(db, user.user_id, body.title if body else None)


@router.get("", response_model=list[ChatOut])
def list_chats(
    q: str | None = Query(default=None, max_length=200, description="Only chats whose title or messages contain this text"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """My chats, the most recently active first. Add ?q=... to search titles and message text."""
    return chat_service.list_chats(db, user.user_id, q)


@router.get("/{chat_id}", response_model=ChatDetail)
def open_chat(chat_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """One chat with all its messages (each reply carries its routing note)."""
    try:
        chat = chat_service.own_chat(db, user.user_id, chat_id)
    except ChatError as error:
        raise http_error(error) from None
    return ChatDetail(
        chat_id=chat.chat_id,
        title=chat.title,
        created_at=chat.created_at,
        updated_at=chat.updated_at,
        messages=chat_service.chat_messages(db, chat.chat_id),
    )


@router.patch("/{chat_id}", response_model=ChatOut)
def rename_chat(
    chat_id: int,
    body: ChatRename,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return chat_service.rename_chat(db, user.user_id, chat_id, body.title)
    except ChatError as error:
        raise http_error(error) from None


@router.delete("/{chat_id}", status_code=204)
def delete_chat(chat_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        chat_service.delete_chat(db, user.user_id, chat_id)
    except ChatError as error:
        raise http_error(error) from None
    return Response(status_code=204)


def get_turn(
    chat_id: int,
    body: SendMessage,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Turn:
    """Runs BEFORE the stream starts, so a wrong chat id or an empty message is a normal
    404 or 422 and not a broken stream. It also saves the user's message."""
    try:
        chat = chat_service.own_chat(db, user.user_id, chat_id)
        return chat_service.prepare_turn(db, user.user_id, chat, body.action, body.text)
    except ChatError as error:
        raise http_error(error) from None


@router.post("/{chat_id}/messages", response_class=EventSourceResponse)
async def send_message(
    turn: Turn = Depends(get_turn),
    settings: Settings = Depends(get_settings),
    session_factory: SessionFactory = Depends(get_session_factory),
) -> AsyncIterator[ServerSentEvent]:
    """Send a message and receive the reply as a stream of Server-Sent Events:
    start, fallback, token (many), done, title, or error. See services/chat_stream.py.

    The stream is a blocking generator. `pump` runs it in a thread and saves a half written reply
    when the browser disconnects (Stop generating), see services/event_pump.py."""
    async for event in pump(stream_reply(turn, settings, session_factory)):
        yield event
