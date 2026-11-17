"""The database connection, built from the DATABASE_URL setting."""

from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

# The engine holds a small pool of open connections. Creating it does not connect yet.
# pool_pre_ping tests a connection before using it, so a restarted database does not break the app.
# connect_timeout: give up after 5 seconds, so "database is down" is reported quickly.
engine = create_engine(
    get_settings().database_url,
    pool_pre_ping=True,
    connect_args={"connect_timeout": 5},
)

SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """FastAPI dependency: gives one session to a request and always closes it afterwards."""
    with SessionLocal() as session:
        yield session
