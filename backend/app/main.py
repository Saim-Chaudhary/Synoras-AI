"""Entry point: creates the FastAPI app and plugs in the URL files from app/api/."""

from fastapi import FastAPI

from app.api import health

app = FastAPI(title="Synoras AI")

app.include_router(health.router)
