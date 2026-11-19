"""Import every model here so Base.metadata knows all the tables (Alembic reads it)."""

from app.models.chat import Chat, Message, Subtask
from app.models.project import Project, ProjectNote, Task
from app.models.user import User

__all__ = ["Chat", "Message", "Project", "ProjectNote", "Subtask", "Task", "User"]
