"""Projects, their tasks, and their notes (SDD 5.2; SRS FR-11, FR-12, UC-5, UC-6).

Where this differs from the SDD data dictionary (decisions A27):
  tasks.description   new: FR-12 asks for an optional description, the SDD table has none
  tasks.created_at    new: keeps the tasks of a column in the order they were added
  task status         stored as todo, in_progress or done (shown as To Do, In Progress, Done)
  note kind           stored as summary or decision (shown as Summary, Decision)
  chats.project_id    is now a real foreign key to projects (ON DELETE CASCADE, see models/chat.py)

Deleting a project deletes its tasks, notes and chats (BR-13): the database does it with
ON DELETE CASCADE, so no row can be left behind.
"""

from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

TASK_STATUSES = ("todo", "in_progress", "done")
NOTE_KINDS = ("summary", "decision")


class Project(Base):
    __tablename__ = "projects"

    project_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # Every query on this table filters by user_id: a project is visible only to its owner (BR-14).
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(150))
    description: Mapped[str] = mapped_column(Text, server_default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# One user cannot have two projects with the same name, capitals do not matter (FR-11).
Index("uq_projects_user_id_lower_title", Project.user_id, func.lower(Project.title), unique=True)


class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = (
        CheckConstraint("status IN ('todo', 'in_progress', 'done')", name="status_valid"),
        Index("ix_tasks_project_id_status", "project_id", "status"),
    )

    task_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # BR-15: every task belongs to exactly one project.
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.project_id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(150))
    description: Mapped[str] = mapped_column(Text, server_default="")
    # BR-16: exactly one status.
    status: Mapped[str] = mapped_column(String(20), server_default="todo")
    due_date: Mapped[date | None] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ProjectNote(Base):
    """A short summary or decision that the user writes for a project."""

    __tablename__ = "project_notes"
    __table_args__ = (
        CheckConstraint("kind IN ('summary', 'decision')", name="kind_valid"),
        Index("ix_project_notes_project_id", "project_id"),
    )

    note_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.project_id", ondelete="CASCADE"))
    kind: Mapped[str] = mapped_column(String(20))
    title: Mapped[str] = mapped_column(String(150))
    content: Mapped[str] = mapped_column(Text, server_default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
