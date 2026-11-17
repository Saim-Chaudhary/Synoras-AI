"""Health checks.

GET /health     is the server running? (does not touch the database)
GET /health/db  can the server reach PostgreSQL, and is pgvector switched on?
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.session import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/db")
def health_db(db: Session = Depends(get_db)) -> dict[str, str | None]:
    try:
        db.execute(text("SELECT 1"))  # the simplest possible question: "are you there?"
        pgvector_version = db.execute(
            text("SELECT extversion FROM pg_extension WHERE extname = 'vector'")
        ).scalar_one_or_none()
    except SQLAlchemyError:
        # 503 = "service unavailable". The real error stays in the server log, not in the answer,
        # because it can contain the database address and user name.
        raise HTTPException(
            status_code=503, detail={"status": "error", "database": "unreachable"}
        ) from None
    return {"status": "ok", "database": "reachable", "pgvector": pgvector_version}
