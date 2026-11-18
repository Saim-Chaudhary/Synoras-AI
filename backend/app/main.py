"""Entry point: creates the FastAPI app and plugs in the URL files from app/api/."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import auth, dev_routing, health
from app.core.config import get_settings
from app.core.security import AuthConfigError

app = FastAPI(title="Synoras AI")

# CORS: a browser only lets a web page call another address (the API on port 8000) if that
# API says so. Only the frontend's own address is allowed, and only the headers it needs.
# No cookies are used (the token travels in the Authorization header), so credentials stay off.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[get_settings().frontend_origin],
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.exception_handler(AuthConfigError)
def auth_not_configured(request: Request, error: AuthConfigError) -> JSONResponse:
    """The server cannot make or check tokens: say so clearly instead of a bare 500."""
    return JSONResponse(status_code=503, content={"detail": str(error)})


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(dev_routing.router)  # temporary test endpoints, see dev_routing.py
