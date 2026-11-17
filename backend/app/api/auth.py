"""POST /auth/register, POST /auth/login, GET /auth/me (SRS FR-1, FR-2)."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import Settings, get_settings
from app.core.security import create_access_token, require_jwt_secret
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import AuthError, authenticate, register_user

router = APIRouter(prefix="/auth", tags=["auth"])

STATUS_FOR_KIND = {
    "email_taken": 409,  # conflict: that email is already registered
    "weak_password": 422,  # the input is not acceptable
    "invalid_login": 401,  # wrong email, wrong password or deactivated: deliberately the same
    "locked": 423,  # the account is temporarily locked
}


def http_error(error: AuthError) -> HTTPException:
    headers = {"WWW-Authenticate": "Bearer"} if error.kind == "invalid_login" else None
    return HTTPException(
        status_code=STATUS_FOR_KIND[error.kind], detail=error.message, headers=headers
    )


@router.post("/register", response_model=RegisterResponse, status_code=201)
def register(
    body: RegisterRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> RegisterResponse:
    """Create an account and log in (the token comes back with the new user)."""
    require_jwt_secret(settings)  # fail BEFORE creating an account we could not log in
    try:
        user = register_user(db, body.name, body.email, body.password)
    except AuthError as error:
        raise http_error(error) from None
    token = create_access_token(user.user_id, user.role, settings)
    return RegisterResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(
    body: LoginRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    """Check email and password and return an access token."""
    require_jwt_secret(settings)
    try:
        user = authenticate(db, body.email, body.password)
    except AuthError as error:
        raise http_error(error) from None
    return TokenResponse(access_token=create_access_token(user.user_id, user.role, settings))


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)) -> User:
    """Who am I? Needs a valid token: this is the example of a protected endpoint."""
    return user
