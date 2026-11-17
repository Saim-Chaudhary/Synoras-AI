"""Registration, login, lock, deactivation and protected endpoints (SRS FR-1, FR-2; SDD 6.1).

These tests use the real PostgreSQL container, but every test is rolled back afterwards.
"""

from datetime import datetime, timedelta, timezone

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.api.deps import get_current_user, require_admin
from app.core.config import Settings, get_settings
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.user import User

pytestmark = pytest.mark.integration

EMAIL = "ali@example.com"
PASSWORD = "correct-password"


def register(client, email=EMAIL, password=PASSWORD, name="Ali Khan"):
    return client.post("/auth/register", json={"name": name, "email": email, "password": password})


def login(client, email=EMAIL, password=PASSWORD):
    return client.post("/auth/login", json={"email": email, "password": password})


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def get_user(db_session, email=EMAIL) -> User:
    db_session.expire_all()  # read what is really in the database now
    return db_session.scalar(select(User).where(User.email == email))


@pytest.fixture
def registered(client):
    """A user that is already registered."""
    assert register(client).status_code == 201


# ---------- registration ----------


def test_register_creates_an_account_and_logs_in(client, db_session):
    response = register(client)
    assert response.status_code == 201
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["email"] == EMAIL
    assert body["user"]["role"] == "User"
    assert body["user"]["status"] == "Active"
    assert body["user"]["auto_memory"] is True
    assert "password" not in response.text  # neither the password nor password_hash is sent back

    saved = get_user(db_session)
    assert saved.password_hash.startswith("$argon2id$")  # BR-9: only a hash is stored
    assert PASSWORD not in saved.password_hash


def test_register_token_works_straight_away(client):
    token = register(client).json()["access_token"]
    assert client.get("/auth/me", headers=auth_header(token)).status_code == 200


def test_duplicate_email_is_rejected(client, registered):
    response = register(client, name="Someone Else")
    assert response.status_code == 409
    assert response.json()["detail"] == "Email already used"


def test_duplicate_email_ignores_upper_case(client, registered):
    assert register(client, email="ALI@Example.COM").status_code == 409


def test_email_is_saved_in_lower_case(client, db_session):
    register(client, email="Ali.Khan@Example.COM")
    assert get_user(db_session, "ali.khan@example.com") is not None


def test_short_password_is_rejected(client, db_session):
    response = register(client, password="1234567")  # 7 characters
    assert response.status_code == 422
    assert response.json()["detail"] == "Password is too short"
    assert get_user(db_session) is None  # nothing was saved


def test_password_of_exactly_8_characters_is_accepted(client):
    assert register(client, password="12345678").status_code == 201


def test_bad_email_format_is_rejected(client):
    assert register(client, email="not-an-email").status_code == 422


def test_empty_name_is_rejected(client):
    assert register(client, name="   ").status_code == 422


# ---------- login ----------


def test_login_returns_a_token_that_works(client, registered):
    response = login(client)
    assert response.status_code == 200
    token = response.json()["access_token"]
    assert response.json()["token_type"] == "bearer"

    me = client.get("/auth/me", headers=auth_header(token))
    assert me.status_code == 200
    assert me.json()["email"] == EMAIL


def test_login_ignores_upper_case_in_the_email(client, registered):
    assert login(client, email="ALI@EXAMPLE.COM").status_code == 200


def test_wrong_password_and_unknown_email_give_the_same_answer(client, registered):
    wrong_password = login(client, password="wrong-password")
    unknown_email = login(client, email="nobody@example.com")
    assert wrong_password.status_code == unknown_email.status_code == 401
    assert wrong_password.json() == unknown_email.json() == {"detail": "Invalid login"}


# ---------- lock after 5 failures ----------


def test_five_wrong_passwords_lock_the_account_for_15_minutes(client, registered, db_session):
    for _ in range(5):
        response = login(client, password="wrong-password")
        assert response.status_code == 401  # the 5th failure is still "Invalid login" (SDD 6.1)

    # Now even the CORRECT password is refused.
    locked = login(client)
    assert locked.status_code == 423
    assert locked.json()["detail"] == "Login is locked, try again later"

    user = get_user(db_session)
    assert user.failed_attempts == 0  # the counter restarts when the lock starts (SDD 6.1)
    remaining = user.locked_until - datetime.now(timezone.utc)
    assert timedelta(minutes=14) < remaining <= timedelta(minutes=15)


def test_four_failures_do_not_lock(client, registered):
    for _ in range(4):
        login(client, password="wrong-password")
    assert login(client).status_code == 200


def test_a_successful_login_resets_the_counter(client, registered, db_session):
    for _ in range(4):
        login(client, password="wrong-password")
    assert login(client).status_code == 200
    assert get_user(db_session).failed_attempts == 0

    # 4 more failures after the reset still do not lock (it is not 8 in a row).
    for _ in range(4):
        login(client, password="wrong-password")
    assert login(client).status_code == 200


def test_the_lock_expires_after_15_minutes(client, registered, db_session):
    user = get_user(db_session)
    user.locked_until = datetime.now(timezone.utc) - timedelta(minutes=1)  # ended a minute ago
    user.failed_attempts = 0
    db_session.commit()

    assert login(client).status_code == 200
    assert get_user(db_session).locked_until is None


def test_the_lock_still_holds_before_it_expires(client, registered, db_session):
    user = get_user(db_session)
    user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=5)
    db_session.commit()

    assert login(client).status_code == 423


def test_wrong_passwords_during_a_lock_are_not_counted(client, registered, db_session):
    user = get_user(db_session)
    user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=5)
    db_session.commit()

    login(client, password="wrong-password")
    assert get_user(db_session).failed_attempts == 0


# ---------- deactivated account ----------


def test_deactivated_account_gets_the_same_invalid_login(client, registered, db_session):
    user = get_user(db_session)
    user.status = "Deactivated"
    db_session.commit()

    deactivated = login(client)  # correct password!
    wrong_password = login(client, password="wrong-password")
    assert deactivated.status_code == 401
    assert deactivated.json() == wrong_password.json() == {"detail": "Invalid login"}


def test_a_token_stops_working_when_the_account_is_deactivated(client, registered, db_session):
    token = login(client).json()["access_token"]
    assert client.get("/auth/me", headers=auth_header(token)).status_code == 200

    user = get_user(db_session)
    user.status = "Deactivated"
    db_session.commit()

    assert client.get("/auth/me", headers=auth_header(token)).status_code == 401


# ---------- protected endpoint ----------


def test_protected_endpoint_without_a_token_is_401(client):
    response = client.get("/auth/me")
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_protected_endpoint_with_a_garbage_token_is_401(client):
    assert client.get("/auth/me", headers=auth_header("garbage")).status_code == 401


def test_protected_endpoint_with_an_expired_token_is_401(client, registered, db_session, test_settings):
    user = get_user(db_session)
    long_ago = datetime.now(timezone.utc) - timedelta(hours=5)
    expired = create_access_token(user.user_id, user.role, test_settings, now=long_ago)
    assert client.get("/auth/me", headers=auth_header(expired)).status_code == 401


def test_token_for_a_user_that_no_longer_exists_is_401(client, test_settings):
    token = create_access_token(999999, "User", test_settings)
    assert client.get("/auth/me", headers=auth_header(token)).status_code == 401


def test_protected_endpoint_with_a_token_is_200(client, registered):
    token = login(client).json()["access_token"]
    response = client.get("/auth/me", headers=auth_header(token))
    assert response.status_code == 200
    assert "password_hash" not in response.text


# ---------- server configuration ----------


def test_login_says_clearly_when_jwt_secret_is_not_set(client):
    app_settings = Settings(_env_file=None, jwt_secret="")
    client.app.dependency_overrides[get_settings] = lambda: app_settings
    response = login(client)
    assert response.status_code == 503
    assert "JWT_SECRET" in response.json()["detail"]


# ---------- admin-only dependency ----------


@pytest.fixture
def admin_client(db_session, test_settings):
    """A tiny separate app with one admin-only and one user-only route, to test the dependencies."""
    small_app = FastAPI()

    @small_app.get("/admin-only")
    def admin_only(admin: User = Depends(require_admin)):
        return {"admin": admin.email}

    @small_app.get("/users-only")
    def users_only(user: User = Depends(get_current_user)):
        return {"user": user.email}

    small_app.dependency_overrides[get_db] = lambda: db_session
    small_app.dependency_overrides[get_settings] = lambda: test_settings
    return TestClient(small_app)


def test_admin_route_without_a_token_is_401(admin_client):
    assert admin_client.get("/admin-only").status_code == 401


def test_admin_route_for_a_normal_user_is_403(client, admin_client, registered):
    token = login(client).json()["access_token"]
    response = admin_client.get("/admin-only", headers=auth_header(token))
    assert response.status_code == 403
    assert admin_client.get("/users-only", headers=auth_header(token)).status_code == 200


def test_admin_route_for_an_administrator_is_200(client, admin_client, registered, db_session):
    user = get_user(db_session)
    user.role = "Administrator"
    db_session.commit()

    token = login(client).json()["access_token"]
    response = admin_client.get("/admin-only", headers=auth_header(token))
    assert response.status_code == 200
    assert response.json() == {"admin": EMAIL}
