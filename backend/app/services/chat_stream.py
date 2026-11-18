"""Answering one message: classify, route, stream the reply, save it, log it (SRS FR-3, FR-20 to FR-22).

stream_reply() is a generator. FastAPI sends every event it yields to the browser as a
Server-Sent Event. In order, a normal answer sends:

    start      the message was classified: complexity, planned tier
    fallback   (only if a tier could not answer) which tier failed and which is tried next
    token      one piece of the reply text, as many times as the model writes pieces
    done       the reply is saved: message id, tier used, time, tokens, estimated cost
    title      (only after the first message of a chat) the new chat title
    error      instead of done, if no model could answer

Two rules shape the code (decisions A24):
  * Before the first token we may still switch to the next tier up. After it we may not: the user
    has already read the text, so a failure then keeps the partial reply and says so.
  * The stream opens its OWN database session. The request's session can already be closed by
    the time a stopped stream runs its clean-up.
"""

import logging
import threading
from collections.abc import Callable, Iterator
from contextlib import AbstractContextManager
from dataclasses import dataclass, field

from fastapi.sse import ServerSentEvent
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models.chat import DEFAULT_TITLE, Chat, Message, Subtask
from app.routing.classifier import Rating, rate
from app.routing.model_client import ModelResult, StreamedReply, model_name_for
from app.routing.router import FALLBACK_KINDS, call_with_fallback, tiers_from
from app.routing.types import TIER_FOR_COMPLEXITY, ModelCallError, Tier
from app.services.chat_service import Turn, now

logger = logging.getLogger(__name__)

SessionFactory = Callable[[], AbstractContextManager[Session]]

SUBTASK_DESCRIPTION_LENGTH = 500
TITLE_MAX_LENGTH = 60
TITLE_PROMPT = (
    "Write a short title for a chat that starts with the message below. "
    "Use at most 6 words, no quotes and no full stop at the end. "
    "Reply with the title only.\n\nMessage:\n{text}"
)


def _event(name: str, **data) -> ServerSentEvent:
    return ServerSentEvent(data=data, event=name)


@dataclass
class StreamState:
    """What the clean-up needs to know, even if the stream was cut off.

    Two places may try to save the reply (the stream itself, and the clean-up the endpoint runs
    when the browser disconnects), so `claim()` lets exactly one of them do it."""

    reply: StreamedReply | None = None
    rating: Rating | None = None
    planned: Tier | None = None
    saved: bool = False
    failures: list[str] = field(default_factory=list)
    _lock: threading.Lock = field(default_factory=threading.Lock)

    def claim(self) -> bool:
        with self._lock:
            if self.saved:
                return False
            self.saved = True
            return True


def _failure_message(failures: list[str]) -> str:
    if len(failures) == 1:
        return failures[0].split(": ", 1)[1]
    return "No model could answer. " + " | ".join(failures)


def _note(planned: Tier, used: Tier, failures: list[str], extra: str | None, estimated: bool) -> str | None:
    parts = []
    if failures:
        parts.append(f"Planned {planned.value}, answered by {used.value}. Unavailable: " + " | ".join(failures))
    if estimated:
        parts.append("Token counts estimated from the text length (the provider sent none).")
    if extra:
        parts.append(extra)
    return " ".join(parts) or None


def _save_reply(
    session_factory: SessionFactory,
    turn: Turn,
    rating: Rating,
    planned: Tier,
    result: ModelResult,
    failures: list[str],
    extra_note: str | None = None,
) -> int:
    """Save the reply as an assistant message and its routing row. Returns the message id."""
    with session_factory() as db:
        message = Message(chat_id=turn.chat_id, sender="assistant", text=result.text, model_used=result.model)
        db.add(message)
        db.flush()
        db.add(
            Subtask(
                message_id=message.message_id,
                kind="reply",
                description=turn.user_text[:SUBTASK_DESCRIPTION_LENGTH],
                complexity=rating.level.value,
                tier=result.tier.value,
                model_used=result.model,
                response_time=result.seconds,
                cost=result.estimated_cost_usd,
                note=_note(planned, result.tier, failures, extra_note, result.usage_estimated),
            )
        )
        chat = db.get(Chat, turn.chat_id)
        if chat is not None:
            chat.updated_at = now()
        db.commit()
        return message.message_id


def _clean_title(text: str) -> str:
    first_line = text.strip().splitlines()[0] if text.strip() else ""
    title = first_line.strip().strip("\"'`*# ").rstrip(".")
    return title[:TITLE_MAX_LENGTH].strip()


def _fallback_title(user_text: str) -> str:
    text = " ".join(user_text.split())
    return text if len(text) <= 40 else text[:39].rstrip() + "…"


def _make_title(session_factory: SessionFactory, turn: Turn, settings: Settings, reply_id: int) -> str | None:
    """Give a new chat a short title from its first message, using the Low tier (or the next tier
    up if it is unavailable). Returns the title, or None when the chat already has its own title."""
    with session_factory() as db:
        chat = db.get(Chat, turn.chat_id)
        user_messages = db.scalar(
            select(func.count()).select_from(Message).where(
                Message.chat_id == turn.chat_id, Message.sender == "user"
            )
        )
        if chat is None or chat.title != DEFAULT_TITLE or user_messages != 1:
            return None  # renamed already, or not the first message

    title = ""
    try:
        result, failures = call_with_fallback(
            tiers_from(Tier.LOCAL), TITLE_PROMPT.format(text=turn.user_text[:1000]), settings
        )
        title = _clean_title(result.text)
        with session_factory() as db:
            db.add(
                Subtask(
                    message_id=reply_id,
                    kind="title",
                    description="Generate a chat title",
                    complexity="Low",
                    tier=result.tier.value,
                    model_used=result.model,
                    response_time=result.seconds,
                    cost=result.estimated_cost_usd,
                    note=_note(Tier.LOCAL, result.tier, failures, None, False),
                )
            )
            db.commit()
    except ModelCallError as error:
        logger.info("Chat title: no model could write it (%s)", error.message)

    title = title or _fallback_title(turn.user_text)
    with session_factory() as db:
        chat = db.get(Chat, turn.chat_id)
        if chat is None or chat.title != DEFAULT_TITLE:
            return None  # the user renamed it while the title was being written
        chat.title = title
        db.commit()
    return title


def save_unfinished(turn: Turn, session_factory: SessionFactory, state: StreamState) -> None:
    """The stream ended without a saved reply: the user pressed Stop, or the connection broke.
    Keep what they already saw. Safe to call more than once: only the first call saves."""
    reply = state.reply
    if reply is None or state.rating is None or state.planned is None or not reply.text.strip():
        return
    if not state.claim():
        return
    try:
        _save_reply(
            session_factory,
            turn,
            state.rating,
            state.planned,
            reply.partial_result(),
            state.failures,
            "Stopped before the reply was finished.",
        )
    except Exception:
        logger.exception("Could not save the partial reply of chat %s", turn.chat_id)


def stream_reply(
    turn: Turn, settings: Settings, session_factory: SessionFactory, state: StreamState | None = None
) -> Iterator[ServerSentEvent]:
    rating = rate(turn.user_text)
    planned = TIER_FOR_COMPLEXITY[rating.level]
    state = state or StreamState()
    state.rating, state.planned = rating, planned
    try:
        yield _event(
            "start",
            chat_id=turn.chat_id,
            user_message_id=turn.user_message_id,
            complexity=rating.level.value,
            uncertain=rating.uncertain,
            reason=rating.reason,
            planned_tier=planned.value,
        )
        yield from _answer(turn, settings, session_factory, rating, planned, state)
    except Exception:
        # A bug must never crash the stream: the user gets a message and can retry.
        logger.exception("Unexpected error while answering chat %s", turn.chat_id)
        yield _event(
            "error",
            kind="internal",
            message="Something went wrong on the server. Your message is saved: try again.",
            partial_saved=False,
        )
    finally:
        # Also run by the endpoint when the browser disconnects (the generator may be closed late).
        save_unfinished(turn, session_factory, state)


def _answer(
    turn: Turn,
    settings: Settings,
    session_factory: SessionFactory,
    rating: Rating,
    planned: Tier,
    state: StreamState,
) -> Iterator[ServerSentEvent]:
    tiers = tiers_from(planned)
    for index, tier in enumerate(tiers):
        reply = StreamedReply(tier, turn.prompt, settings)
        state.reply = reply
        try:
            for piece in reply:
                yield _event("token", text=piece)
        except ModelCallError as error:
            if reply.text.strip():
                # Text is already on the user's screen, so we cannot switch to another tier.
                if not state.claim():
                    return
                message_id = _save_reply(
                    session_factory, turn, rating, planned, reply.partial_result(), state.failures,
                    f"Interrupted: {error.message}",
                )
                yield _event(
                    "error",
                    kind=error.kind,
                    message=f"The reply was interrupted: {error.message}",
                    partial_saved=True,
                    message_id=message_id,
                )
                return
            state.failures.append(f"{tier.value}: {error.message}")
            state.reply = None
            if error.kind in FALLBACK_KINDS and index + 1 < len(tiers):
                yield _event(
                    "fallback",
                    from_tier=tier.value,
                    to_tier=tiers[index + 1].value,
                    reason=error.message,
                )
                continue
            state.claim()  # nothing to save: no model answered
            yield _event(
                "error", kind=error.kind, message=_failure_message(state.failures), partial_saved=False
            )
            return

        result = reply.result
        assert result is not None
        if not state.claim():
            return  # the clean-up already saved the partial reply
        message_id = _save_reply(session_factory, turn, rating, planned, result, state.failures)
        yield _event(
            "done",
            message_id=message_id,
            model=result.model,
            tier=result.tier.value,
            planned_tier=planned.value,
            fallback_used=bool(state.failures),
            fallback_reason=" | ".join(state.failures) or None,
            complexity=rating.level.value,
            seconds=result.seconds,
            tokens_in=result.tokens_in,
            tokens_out=result.tokens_out,
            estimated_cost_usd=result.estimated_cost_usd,
            actual_cost_usd=result.actual_cost_usd,
            usage_estimated=result.usage_estimated,
        )
        title = _make_title(session_factory, turn, settings, message_id)
        if title:
            yield _event("title", chat_id=turn.chat_id, title=title)
        return
