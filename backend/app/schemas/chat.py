"""The shape of the data going in and out of the /chats endpoints."""

from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

# Same limit as the column. Spaces around the title are removed.
Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)]

MAX_MESSAGE_LENGTH = 8000


class ChatCreate(BaseModel):
    title: Title | None = None  # empty: the chat starts as "New chat" and gets a title from its first message


class ChatRename(BaseModel):
    title: Title


class ProjectRef(BaseModel):
    """Which project a chat belongs to (shown in the chat's header)."""

    project_id: int
    title: str


class ChatOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    chat_id: int
    project_id: int | None = None  # empty for a personal chat
    title: str
    created_at: datetime
    updated_at: datetime


class RoutingOut(BaseModel):
    """How a reply was routed: shown as the small note under the reply (for the evaluation)."""

    complexity: str
    tier: str
    model: str
    seconds: float
    estimated_cost_usd: float | None
    note: str | None


class MessageOut(BaseModel):
    message_id: int
    sender: Literal["user", "assistant"]
    text: str
    model_used: str | None
    created_at: datetime
    routing: RoutingOut | None = None  # only for replies


class ChatDetail(ChatOut):
    project: ProjectRef | None = None
    messages: list[MessageOut]


class SendMessage(BaseModel):
    """What the user wants to do in a chat.

    send        add `text` as a new message and answer it
    regenerate  throw away the last reply and answer the last message again (no text needed)
    edit        replace the text of the last user message with `text`, throw away what came
                after it, and answer it again
    """

    action: Literal["send", "regenerate", "edit"] = "send"
    text: str | None = Field(default=None, max_length=MAX_MESSAGE_LENGTH)
