"""Entry point: creates the FastAPI app and plugs in the URL files from app/api/."""

from fastapi import FastAPI

from app.api import dev_routing, health

app = FastAPI(title="Synoras AI")

app.include_router(health.router)
app.include_router(dev_routing.router)  # temporary test endpoints, see dev_routing.py
