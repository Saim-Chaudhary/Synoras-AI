"""Import every model here so Base.metadata knows all the tables (Alembic reads it)."""

from app.models.chat import Chat, Message, Subtask
from app.models.user import User

__all__ = ["Chat", "Message", "Subtask", "User"]
