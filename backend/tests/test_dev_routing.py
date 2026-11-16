import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routing import router
from app.routing.model_client import ModelResult
from app.routing.types import ModelCallError, Tier

client = TestClient(app)


@pytest.fixture
def fake_models(monkeypatch):
    state = {"error": None}

    def fake_call_model(tier, prompt, settings=None):
        if state["error"]:
            raise state["error"]
        return ModelResult(f"echo: {prompt}", f"model-{tier.value}", tier, 0.25, 11, 22, 0.0005, 0.0)

    monkeypatch.setattr(router, "call_model", fake_call_model)
    return state


def test_classify_shows_level_and_tier():
    response = client.post("/dev/classify", json={"message": "hello"})
    assert response.status_code == 200
    body = response.json()
    assert body["complexity"] == "Low"
    assert body["tier"] == "local"
    assert body["uncertain"] is False
    assert "score" in body["reason"]


def test_route_returns_answer_time_cost_and_tier(fake_models):
    response = client.post("/dev/route", json={"message": "Explain how photosynthesis works"})
    assert response.status_code == 200
    body = response.json()
    assert body["complexity"] == "Medium"
    assert body["planned_tier"] == body["tier_used"] == "small_cloud"
    assert body["answer"] == "echo: Explain how photosynthesis works"
    assert body["seconds"] == 0.25
    assert body["estimated_cost_usd"] == 0.0005
    assert body["actual_cost_usd"] == 0.0
    assert body["fallback_used"] is False


def test_force_tier_overrides_the_classifier(fake_models):
    response = client.post("/dev/route", json={"message": "hello", "force_tier": "strong_cloud"})
    assert response.status_code == 200
    body = response.json()
    assert body["complexity"] == "Low"
    assert body["tier_used"] == "strong_cloud"


@pytest.mark.parametrize("message", ["", "   "])
def test_empty_message_is_rejected(message):
    assert client.post("/dev/route", json={"message": message}).status_code == 422
    assert client.post("/dev/classify", json={"message": message}).status_code == 422


def test_unknown_tier_is_rejected():
    response = client.post("/dev/route", json={"message": "hi", "force_tier": "huge"})
    assert response.status_code == 422


@pytest.mark.parametrize(
    ("kind", "status"),
    [("rate_limited", 429), ("unavailable", 503), ("auth", 502), ("model_not_found", 502)],
)
def test_model_failures_become_readable_errors(fake_models, kind, status):
    fake_models["error"] = ModelCallError(kind, "readable message", Tier.STRONG_CLOUD)
    response = client.post("/dev/route", json={"message": HIGH})
    assert response.status_code == status
    detail = response.json()["detail"]
    assert detail["kind"] == kind
    assert detail["message"] == "readable message"
    assert detail["complexity"] == "High"


HIGH = "Analyze the trade-offs between microservices and a monolith and design a plan step by step"
