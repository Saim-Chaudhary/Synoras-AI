"""The shape of the data going in and out of the /dev routing endpoints."""

from typing import Annotated

from pydantic import BaseModel, StringConstraints

from app.routing.types import Complexity, Tier

# Whitespace is trimmed first, so a message of only spaces counts as empty (FR-3: no empty message).
Message = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=8000)]


class ClassifyRequest(BaseModel):
    message: Message


class ClassifyResponse(BaseModel):
    complexity: Complexity
    tier: Tier  # the tier this complexity maps to (SDD 6.2)
    uncertain: bool
    reason: str


class RouteRequest(BaseModel):
    message: Message
    force_tier: Tier | None = None  # leave empty to let the classifier choose


class RouteResponse(BaseModel):
    complexity: Complexity
    uncertain: bool
    reason: str
    planned_tier: Tier  # what the classifier chose
    tier_used: Tier  # what actually ran (differs after a fallback)
    model: str
    answer: str
    seconds: float
    tokens_in: int | None
    tokens_out: int | None
    estimated_cost_usd: float | None  # at the model's published paid price
    actual_cost_usd: float | None  # what we really pay (0 on free plans)
    fallback_used: bool
    fallback_reason: str | None
