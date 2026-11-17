"""Reusable checks that other endpoints plug in to protect themselves.

    @router.get("/something")
    def something(user: User = Depends(get_current_user)): ...        # any logged-in user

    @router.get("/admin/something")
    def admin_thing(admin: User = Depends(require_admin)): ...        # administrators only
"""

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.security import TokenError, decode_access_token
from app.db.session import get_db
from app.models.user import User

# Shows the "Authorize" button on /docs. auto_error=False so that WE answer a missing token
# with a clear 401 (FastAPI's own answer for "no token" has changed between versions).
bearer_scheme = HTTPBearer(
    auto_error=False,
    description="Paste the access_token you got from POST /auth/login (without the word Bearer).",
)


def unauthorized(message: str) -> HTTPException:
    return HTTPException(
        status_code=401, detail=message, headers={"WWW-Authenticate": "Bearer"}
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> User:
    """Read the token, find the user, and refuse everything that is not a valid active account."""
    if credentials is None:
        raise unauthorized("Not authenticated")
    try:
        user_id = decode_access_token(credentials.credentials, settings)
    except TokenError:
        raise unauthorized("Invalid or expired token") from None

    user = db.get(User, user_id)
    # Checked on every request, so deactivating an account stops its old tokens too.
    if user is None or user.status != "Active":
        raise unauthorized("Invalid or expired token")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Only administrators pass (SRS BR-25 and FR-25 admin features come later)."""
    if user.role != "Administrator":
        raise HTTPException(status_code=403, detail="Administrator access required")
    return user
