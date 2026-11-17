"""The users table (SDD 5.2 data dictionary; FR-1, FR-2, FR-7, FR-25)."""

from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('User', 'Administrator')", name="role_valid"),
        CheckConstraint("status IN ('Active', 'Deactivated')", name="status_valid"),
    )

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    # Unique: "Email already used" at registration (SDD 6.1). Login looks users up by email.
    email: Mapped[str] = mapped_column(String(150), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))  # never the plain password (BR-9)
    role: Mapped[str] = mapped_column(String(20), server_default="User")
    status: Mapped[str] = mapped_column(String(20), server_default="Active")
    # B7: the on/off switch for automatic memory collection (FR-5, FR-7).
    auto_memory: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    # Login lock: 5 failed logins in a row lock the account for 15 minutes (SDD 6.1).
    failed_attempts: Mapped[int] = mapped_column(Integer, server_default=text("0"))
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
