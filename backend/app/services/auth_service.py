"""Registration and login rules (SDD 6.1; SRS FR-1, FR-2, BR-9, BR-10).

This file decides; it knows nothing about HTTP. It raises AuthError and the API file turns
that into a status code.
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password, spend_time_like_a_real_check, verify_password
from app.models.user import User

MIN_PASSWORD_LENGTH = 8  # BR-10
MAX_FAILED_ATTEMPTS = 5  # FR-2
LOCK_DURATION = timedelta(minutes=15)  # FR-2


class AuthError(Exception):
    """kind is one of: email_taken, weak_password, invalid_login, locked."""

    def __init__(self, kind: str, message: str):
        super().__init__(message)
        self.kind = kind
        self.message = message


def normalize_email(email: str) -> str:
    """Emails are saved in lower case, so "Ali@Mail.com" and "ali@mail.com" are one account."""
    return email.strip().lower()


def register_user(db: Session, name: str, email: str, password: str) -> User:
    if len(password) < MIN_PASSWORD_LENGTH:
        raise AuthError("weak_password", "Password is too short")

    email = normalize_email(email)
    if db.scalar(select(User).where(User.email == email)) is not None:
        raise AuthError("email_taken", "Email already used")

    user = User(name=name.strip(), email=email, password_hash=hash_password(password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        # Two people registered the same email at the same moment: the database's UNIQUE rule
        # lets only one through, and the other lands here.
        db.rollback()
        raise AuthError("email_taken", "Email already used") from None
    db.refresh(user)  # loads the values the database filled in (role, status, ...)
    return user


def authenticate(
    db: Session, email: str, password: str, *, now: datetime | None = None
) -> User:
    """Check an email and password. Returns the user, or raises AuthError."""
    now = now or datetime.now(timezone.utc)
    email = normalize_email(email)

    # FOR UPDATE locks this user's row until we commit, so two wrong guesses sent at the same
    # instant are counted one after the other and cannot both read the same "failed" number.
    user = db.scalar(select(User).where(User.email == email).with_for_update())

    # Unknown email and deactivated account get the same answer as a wrong password.
    if user is None or user.status == "Deactivated":
        spend_time_like_a_real_check(password)
        raise AuthError("invalid_login", "Invalid login")

    if user.locked_until is not None and user.locked_until > now:
        raise AuthError("locked", "Login is locked, try again later")

    if not verify_password(password, user.password_hash):
        user.failed_attempts += 1
        if user.failed_attempts >= MAX_FAILED_ATTEMPTS:
            user.locked_until = now + LOCK_DURATION
            user.failed_attempts = 0
        db.commit()  # save the count BEFORE raising, or the error would undo it
        raise AuthError("invalid_login", "Invalid login")

    user.failed_attempts = 0
    user.locked_until = None
    db.commit()
    return user
