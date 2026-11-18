"""CORS: the website at the frontend origin may call the API from a browser; other sites may not."""

from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app

client = TestClient(app)
ALLOWED = get_settings().frontend_origin
EVIL = "http://evil.example"


def preflight(origin: str, headers: str = "content-type"):
    """The 'may I?' request a browser sends before a POST with a JSON body."""
    return client.options(
        "/auth/login",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": headers,
        },
    )


def test_frontend_origin_is_allowed():
    response = preflight(ALLOWED)
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ALLOWED


def test_authorization_header_is_allowed():
    response = preflight(ALLOWED, headers="authorization, content-type")
    assert response.status_code == 200
    assert "authorization" in response.headers["access-control-allow-headers"].lower()


def test_normal_responses_carry_the_allow_header():
    response = client.get("/health", headers={"Origin": ALLOWED})
    assert response.headers["access-control-allow-origin"] == ALLOWED


def test_other_sites_are_refused():
    response = preflight(EVIL)
    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_other_sites_get_no_allow_header_on_normal_requests():
    response = client.get("/health", headers={"Origin": EVIL})
    assert "access-control-allow-origin" not in response.headers
