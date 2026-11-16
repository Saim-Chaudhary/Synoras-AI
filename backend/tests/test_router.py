import pytest

from app.core.config import Settings
from app.routing import router
from app.routing.model_client import ModelResult
from app.routing.types import Complexity, ModelCallError, Tier

LOW = "hello"
MEDIUM = "Explain how photosynthesis works"
HIGH = (
    "Analyze the trade-offs between microservices and a monolith and design a "
    "migration plan step by step"
)

SETTINGS = Settings(_env_file=None)


def fake_result(tier: Tier) -> ModelResult:
    return ModelResult("answer", f"model-{tier.value}", tier, 0.1, 5, 7, 0.001, 0.0)


@pytest.fixture
def calls(monkeypatch):
    """Replace the real model call. `failures` maps a tier to the error it should raise."""
    record = {"tiers": [], "failures": {}}

    def fake_call_model(tier, prompt, settings=None):
        record["tiers"].append(tier)
        if tier in record["failures"]:
            raise record["failures"][tier]
        return fake_result(tier)

    monkeypatch.setattr(router, "call_model", fake_call_model)
    return record


@pytest.mark.parametrize(
    ("message", "level", "tier"),
    [
        (LOW, Complexity.LOW, Tier.LOCAL),
        (MEDIUM, Complexity.MEDIUM, Tier.SMALL_CLOUD),
        (HIGH, Complexity.HIGH, Tier.STRONG_CLOUD),
    ],
)
def test_each_level_goes_to_its_tier(calls, message, level, tier):
    routed = router.route(message, SETTINGS)
    assert routed.rating.level == level
    assert routed.planned_tier == tier
    assert routed.result.tier == tier
    assert not routed.fallback_used
    assert calls["tiers"] == [tier]


def test_low_falls_back_to_small_cloud_when_ollama_is_missing(calls):
    calls["failures"][Tier.LOCAL] = ModelCallError("unavailable", "Ollama is down", Tier.LOCAL)
    routed = router.route(LOW, SETTINGS)
    assert routed.planned_tier == Tier.LOCAL
    assert routed.result.tier == Tier.SMALL_CLOUD
    assert routed.fallback_used
    assert "Ollama is down" in routed.fallback_reason
    assert calls["tiers"] == [Tier.LOCAL, Tier.SMALL_CLOUD]


def test_not_configured_local_also_falls_back(calls):
    calls["failures"][Tier.LOCAL] = ModelCallError("not_configured", "no model", Tier.LOCAL)
    assert router.route(LOW, SETTINGS).fallback_used


def test_other_local_errors_do_not_fall_back(calls):
    calls["failures"][Tier.LOCAL] = ModelCallError("other", "weird", Tier.LOCAL)
    with pytest.raises(router.RoutingError) as caught:
        router.route(LOW, SETTINGS)
    assert caught.value.kind == "other"
    assert calls["tiers"] == [Tier.LOCAL]


def test_forced_tier_skips_the_choice_and_the_fallback(calls):
    routed = router.route(LOW, SETTINGS, force_tier=Tier.STRONG_CLOUD)
    assert routed.result.tier == Tier.STRONG_CLOUD
    assert routed.rating.level == Complexity.LOW  # still rated, for comparison
    assert calls["tiers"] == [Tier.STRONG_CLOUD]


def test_forced_local_that_fails_is_not_rescued(calls):
    calls["failures"][Tier.LOCAL] = ModelCallError("unavailable", "down", Tier.LOCAL)
    with pytest.raises(router.RoutingError):
        router.route(LOW, SETTINGS, force_tier=Tier.LOCAL)
    assert calls["tiers"] == [Tier.LOCAL]


def test_failure_of_the_fallback_is_reported_with_the_rating(calls):
    calls["failures"][Tier.LOCAL] = ModelCallError("unavailable", "down", Tier.LOCAL)
    calls["failures"][Tier.SMALL_CLOUD] = ModelCallError("rate_limited", "slow down", Tier.SMALL_CLOUD)
    with pytest.raises(router.RoutingError) as caught:
        router.route(LOW, SETTINGS)
    assert caught.value.kind == "rate_limited"
    assert caught.value.rating.level == Complexity.LOW
    assert caught.value.planned_tier == Tier.LOCAL
