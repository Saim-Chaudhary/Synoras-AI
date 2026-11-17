"""Tests for GET /health/db.

The first two tests use a fake database session, so they run anywhere. The last two talk to the
real PostgreSQL container and are skipped if it is not running (start it with docker compose).
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import inspect, text
from sqlalchemy.exc import OperationalError

from app.db.session import engine, get_db
from app.main import app

client = TestClient(app)


class FakeResult:
    def __init__(self, value):
        self.value = value

    def scalar_one_or_none(self):
        return self.value


class WorkingSession:
    def execute(self, statement):
        return FakeResult("0.8.7")


class BrokenSession:
    def execute(self, statement):
        raise OperationalError("SELECT 1", {}, Exception("connection refused: secret-host"))


@pytest.fixture
def use_session():
    """Swap the database session used by the endpoint, and always put the real one back."""

    def install(session):
        app.dependency_overrides[get_db] = lambda: session

    yield install
    app.dependency_overrides.clear()


def test_health_db_reports_ok_and_pgvector_version(use_session):
    use_session(WorkingSession())
    response = client.get("/health/db")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "reachable", "pgvector": "0.8.7"}


def test_health_db_returns_503_when_database_is_down_without_leaking_details(use_session):
    use_session(BrokenSession())
    response = client.get("/health/db")
    assert response.status_code == 503
    assert response.json()["detail"] == {"status": "error", "database": "unreachable"}
    assert "secret-host" not in response.text


@pytest.fixture
def real_database():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except OperationalError:
        pytest.skip("PostgreSQL container is not running")


@pytest.mark.integration
def test_health_db_with_real_postgres(real_database):
    response = client.get("/health/db")
    assert response.status_code == 200
    body = response.json()
    assert body["database"] == "reachable"
    assert body["pgvector"] is not None  # migration 0001 switched pgvector on


@pytest.mark.integration
def test_users_table_has_the_columns_from_the_sdd(real_database):
    columns = {column["name"] for column in inspect(engine).get_columns("users")}
    assert columns == {
        "user_id",
        "name",
        "email",
        "password_hash",
        "role",
        "status",
        "auto_memory",
        "failed_attempts",
        "locked_until",
    }
