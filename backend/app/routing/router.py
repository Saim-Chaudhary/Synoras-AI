"""The router: rate the message, pick the tier, run it (SDD 6.2, SRS FR-21).

Fallback implemented here: if the local model is unavailable (or not set up yet), a Low
subtask goes to the smaller cloud model instead. The quality-check rerun on the stronger
model comes later, with the multi-agent step.
"""

from dataclasses import dataclass

from app.core.config import Settings, get_settings
from app.routing.classifier import Rating, rate
from app.routing.model_client import ModelResult, call_model
from app.routing.types import TIER_FOR_COMPLEXITY, ModelCallError, Tier

# Only these errors mean "the local model is not there". Anything else is a real failure.
LOCAL_MISSING_KINDS = {"not_configured", "unavailable"}


@dataclass(frozen=True)
class RoutedResult:
    rating: Rating
    planned_tier: Tier  # what the classifier chose
    result: ModelResult  # what actually ran (result.tier is the tier used)
    fallback_used: bool
    fallback_reason: str | None


class RoutingError(ModelCallError):
    """A model call failed after routing. Carries the rating so the caller can still show it."""

    def __init__(self, error: ModelCallError, rating: Rating, planned_tier: Tier):
        super().__init__(error.kind, error.message, error.tier)
        self.rating = rating
        self.planned_tier = planned_tier


def route(
    message: str,
    settings: Settings | None = None,
    *,
    force_tier: Tier | None = None,
) -> RoutedResult:
    """Classify `message`, run it on the matching tier and return everything the log needs.

    `force_tier` skips the choice (used to test one tier, for example a Groq key check);
    the message is still rated so you can compare, and no fallback happens.
    """
    settings = settings or get_settings()
    rating = rate(message)
    planned = force_tier or TIER_FOR_COMPLEXITY[rating.level]

    try:
        result = call_model(planned, message, settings)
        return RoutedResult(rating, planned, result, fallback_used=False, fallback_reason=None)
    except ModelCallError as error:
        can_fall_back = (
            force_tier is None and planned is Tier.LOCAL and error.kind in LOCAL_MISSING_KINDS
        )
        if not can_fall_back:
            raise RoutingError(error, rating, planned) from error
        local_problem = error.message

    try:
        result = call_model(Tier.SMALL_CLOUD, message, settings)
    except ModelCallError as error:
        raise RoutingError(error, rating, planned) from error
    return RoutedResult(rating, planned, result, fallback_used=True, fallback_reason=local_problem)


# ---------------------------------------------------------------------------------------
# Falling back to the next tier UP (used by chat, decisions A24)
# ---------------------------------------------------------------------------------------

TIER_ORDER = (Tier.LOCAL, Tier.SMALL_CLOUD, Tier.STRONG_CLOUD)

# When a tier fails with one of these, it counts as "unavailable" and the next tier up is tried.
# "other" (for example an empty answer) is not in the list: another model would not fix it.
FALLBACK_KINDS = {
    "not_configured",
    "unavailable",
    "unreachable",
    "server_error",
    "rate_limited",
    "model_not_found",
    "auth",
}


def tiers_from(planned: Tier) -> list[Tier]:
    """The planned tier and every tier above it, in the order they are tried."""
    return list(TIER_ORDER[TIER_ORDER.index(planned) :])


def call_with_fallback(
    tiers: list[Tier], prompt: str | list, settings: Settings | None = None
) -> tuple[ModelResult, list[str]]:
    """Ask the tiers in order until one answers. Returns the result and a note for each tier that failed."""
    settings = settings or get_settings()
    failures: list[str] = []
    last_error: ModelCallError | None = None
    for tier in tiers:
        try:
            return call_model(tier, prompt, settings), failures
        except ModelCallError as error:
            failures.append(f"{tier.value}: {error.message}")
            last_error = error
            if error.kind not in FALLBACK_KINDS:
                raise
    assert last_error is not None
    raise last_error
