"""Entry point: creates the FastAPI app and plugs in the URL files from app/api/."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api import auth, dev_routing, health
from app.core.security import AuthConfigError

app = FastAPI(title="Synoras AI")


@app.exception_handler(AuthConfigError)
def auth_not_configured(request: Request, error: AuthConfigError) -> JSONResponse:
    """The server cannot make or check tokens: say so clearly instead of a bare 500."""
    return JSONResponse(status_code=503, content={"detail": str(error)})


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(dev_routing.router)  # temporary test endpoints, see dev_routing.py
