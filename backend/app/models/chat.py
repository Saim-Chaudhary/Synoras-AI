"""Chats, their messages, and the routing log of each reply (SDD 5.2; FR-3, FR-4, FR-22).

Where this differs from the SDD data dictionary (decisions A23):
  chats.updated_at      new: the time of the last message, so the newest chat is listed first
  chats.project_id      a foreign key to projects since the Projects step (decisions A27)
  subtasks.message_id   points to the REPLY (assistant message), not the request
  subtasks.kind/tier/note/created_at   new: reply or title, the tier used, fallback notes, and a date
"""

from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

DEFAULT_TITLE = "New chat"


class Chat(Base):
    __tablename__ = "chats"
    __table_args__ = (
        Index("ix_chats_user_id_updated_at", "user_id", "updated_at"),
        Index("ix_chats_project_id", "project_id"),
    )

    chat_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # Every query on this table filters by user_id: a user only ever sees their own chats (BR-1).
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"))
    # Empty for a personal chat. Deleting the project deletes its chats too (BR-13, decisions A27).
    project_id: Mapped[int | None] = mapped_column(ForeignKey("projects.project_id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(150), server_default=DEFAULT_TITLE)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (
        CheckConstraint("sender IN ('user', 'assistant')", name="sender_valid"),
        Index("ix_messages_chat_id_message_id", "chat_id", "message_id"),
    )

    message_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    chat_id: Mapped[int] = mapped_column(ForeignKey("chats.chat_id", ondelete="CASCADE"))
    sender: Mapped[str] = mapped_column(String(20))  # "user" or "assistant"
    text: Mapped[str] = mapped_column(Text)
    model_used: Mapped[str | None] = mapped_column(String(50))  # empty for a user message
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Subtask(Base):
    """One routing decision and its result: which complexity, which model, how long, what cost."""

    __tablename__ = "subtasks"
    __table_args__ = (CheckConstraint("kind IN ('reply', 'title')", name="kind_valid"),)

    subtask_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    message_id: Mapped[int] = mapped_column(
        ForeignKey("messages.message_id", ondelete="CASCADE"), index=True
    )
    kind: Mapped[str] = mapped_column(String(20))  # "reply" or "title"
    description: Mapped[str] = mapped_column(Text)  # what the subtask had to do
    complexity: Mapped[str] = mapped_column(String(10))  # Low, Medium or High
    tier: Mapped[str] = mapped_column(String(20))  # local, small_cloud or strong_cloud (the one used)
    model_used: Mapped[str] = mapped_column(String(50))
    response_time: Mapped[float] = mapped_column(Float)  # seconds
    cost: Mapped[float | None] = mapped_column(Float)  # ESTIMATED cost in US dollars (decisions A12)
    note: Mapped[str | None] = mapped_column(Text)  # fallback, stop, or token-estimate remarks
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
