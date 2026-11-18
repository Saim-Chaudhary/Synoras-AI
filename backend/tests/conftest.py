"""Shared test setup for tests that need the real database and a working login configuration."""

from contextlib import nullcontext

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.db.session import engine, get_db, get_session_factory
from app.main import app

TEST_JWT_SECRET = "test-secret-that-is-long-enough-for-hs256-0123456789"


@pytest.fixture(scope="session")
def database_available() -> bool:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except OperationalError:
        return False


@pytest.fixture
def test_settings() -> Settings:
    return Settings(_env_file=None, jwt_secret=TEST_JWT_SECRET, access_token_expire_minutes=60)


@pytest.fixture
def db_session(database_available):
    """A database session whose changes are ALL undone when the test ends.

    The session works inside an outer transaction. commit() inside the app only releases a
    savepoint, and the final rollback() throws everything away, so tests never leave rows behind.
    """
    if not database_available:
        pytest.skip("PostgreSQL container is not running")
    connection = engine.connect()
    outer_transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield session
    finally:
        session.close()
        outer_transaction.rollback()
        connection.close()


@pytest.fixture
def client(db_session, test_settings):
    """A test client whose app uses the rolled-back session and the test settings.

    A streamed answer opens its own session, so the "new session" factory is replaced too:
    it hands out the same rolled-back session (and does not close it).
    """
    app.dependency_overrides[get_db] = lambda: db_session
    app.dependency_overrides[get_settings] = lambda: test_settings
    app.dependency_overrides[get_session_factory] = lambda: (lambda: nullcontext(db_session))
    yield TestClient(app)
    app.dependency_overrides.clear()
