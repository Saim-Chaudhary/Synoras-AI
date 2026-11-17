"""Import every model here so Base.metadata knows all the tables (Alembic reads it)."""

from app.models.user import User

__all__ = ["User"]
