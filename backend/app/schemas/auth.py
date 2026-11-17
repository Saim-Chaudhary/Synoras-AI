"""The shape of the data going in and out of the /auth endpoints."""

from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints, field_validator

# 150 and 100 match the column sizes of the users table. 128 stops absurdly long passwords
# from making the server spend time on them.
MAX_EMAIL_LENGTH = 150
MAX_PASSWORD_LENGTH = 128

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


class RegisterRequest(BaseModel):
    name: Name
    email: EmailStr  # a wrong format is rejected here (SRS UC-1 1.1.E2)
    password: str = Field(max_length=MAX_PASSWORD_LENGTH)  # "too short" is checked in the service

    @field_validator("email")
    @classmethod
    def email_fits_the_column(cls, value: str) -> str:
        if len(value) > MAX_EMAIL_LENGTH:
            raise ValueError(f"Email must be at most {MAX_EMAIL_LENGTH} characters")
        return value


class LoginRequest(BaseModel):
    # Plain text on purpose: a badly formed email just gets "Invalid login" like any wrong login.
    email: str = Field(max_length=MAX_EMAIL_LENGTH)
    password: str = Field(max_length=MAX_PASSWORD_LENGTH)


class UserResponse(BaseModel):
    """What we show about a user. There is no password_hash here, on purpose."""

    model_config = ConfigDict(from_attributes=True)

    user_id: int
    name: str
    email: str
    role: str
    status: str
    auto_memory: bool


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterResponse(TokenResponse):
    """After registering the user is logged in (SRS UC-1 POST-1), so a token comes with the user."""

    user: UserResponse
