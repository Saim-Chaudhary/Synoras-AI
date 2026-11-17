"""Password hashing (argon2) and login tokens (JWT). SRS BR-9, FR-2; SDD 6.1.

Nothing here touches the database or FastAPI: it only turns passwords into hashes and
users into tokens, and back.
"""

from datetime import datetime, timedelta, timezone
from functools import lru_cache

import jwt
from pwdlib import PasswordHash
from pwdlib.exceptions import HashVerificationError, UnknownHashError

from app.core.config import Settings

ALGORITHM = "HS256"  # fixed on purpose: decode() only accepts this one (blocks "alg: none" tricks)
MIN_SECRET_LENGTH = 32

# recommended() = argon2id with safe default settings. Every hash gets its own random salt.
password_hash = PasswordHash.recommended()


class AuthConfigError(Exception):
    """The server is not set up for logins (JWT_SECRET missing or too short)."""


class TokenError(Exception):
    """The token is missing a part, has a bad signature, is expired or is otherwise not valid."""


def hash_password(password: str) -> str:
    """Turn a password into a hash that is safe to store. The password itself is never stored."""
    return password_hash.hash(password)


def verify_password(password: str, stored_hash: str) -> bool:
    """True only if `password` matches the stored hash. A broken stored hash counts as no match."""
    try:
        return password_hash.verify(password, stored_hash)
    except (UnknownHashError, HashVerificationError):
        return False


@lru_cache
def _dummy_hash() -> str:
    return hash_password("dummy-password-for-timing")


def spend_time_like_a_real_check(password: str) -> None:
    """Do the same slow work as a real password check.

    Used when the email does not exist: otherwise "no such account" would answer faster than
    "wrong password", and anybody could use the speed difference to find out which emails exist.
    """
    verify_password(password, _dummy_hash())


def require_jwt_secret(settings: Settings) -> str:
    secret = settings.jwt_secret.get_secret_value()
    if len(secret) < MIN_SECRET_LENGTH:
        raise AuthConfigError(
            f"JWT_SECRET is missing or too short (at least {MIN_SECRET_LENGTH} characters). "
            "Set it in backend/.env. See .env.example for a command that makes one."
        )
    return secret


def create_access_token(
    user_id: int, role: str, settings: Settings, *, now: datetime | None = None
) -> str:
    """Make a signed token that says "this is user N with this role" until it expires."""
    secret = require_jwt_secret(settings)
    now = now or datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),  # "subject": whom the token is about (JWT says this must be text)
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
    }
    return jwt.encode(payload, secret, algorithm=ALGORITHM)


def decode_access_token(token: str, settings: Settings) -> int:
    """Check the token (signature and expiry) and return the user id inside it."""
    secret = require_jwt_secret(settings)
    try:
        payload = jwt.decode(
            token, secret, algorithms=[ALGORITHM], options={"require": ["exp", "sub"]}
        )
        return int(payload["sub"])
    except (jwt.PyJWTError, ValueError) as error:
        raise TokenError("Invalid or expired token") from error
