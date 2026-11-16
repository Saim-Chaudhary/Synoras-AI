"""TEMPORARY test endpoints for the model layer. Remove or protect them in the Login step.

They have no login and POST /dev/route spends your free quota, so they are only for local
testing on 127.0.0.1 (the default of `fastapi dev`).
"""

from fastapi import APIRouter, Depends, HTTPException

from app.core.config import Settings, get_settings
from app.routing.classifier import rate
from app.routing.router import RoutingError, route
from app.routing.types import TIER_FOR_COMPLEXITY
from app.schemas.routing import ClassifyRequest, ClassifyResponse, RouteRequest, RouteResponse

router = APIRouter(prefix="/dev", tags=["dev (temporary)"])

# Which HTTP status each kind of model failure gets. 502/503 mean "the model side has a problem".
STATUS_FOR_KIND = {
    "not_configured": 503,
    "unavailable": 503,
    "unreachable": 503,
    "server_error": 502,
    "rate_limited": 429,
    "auth": 502,  # our key to the provider was rejected; not the caller's login
    "model_not_found": 502,
    "other": 502,
}


@router.post("/classify", response_model=ClassifyResponse)
def classify(request: ClassifyRequest) -> ClassifyResponse:
    """Rate a message Low, Medium or High and show the tier it maps to. Free: no model is called."""
    rating = rate(request.message)
    return ClassifyResponse(
        complexity=rating.level,
        tier=TIER_FOR_COMPLEXITY[rating.level],
        uncertain=rating.uncertain,
        reason=rating.reason,
    )


@router.post("/route", response_model=RouteResponse)
def route_message(
    request: RouteRequest, settings: Settings = Depends(get_settings)
) -> RouteResponse:
    """Rate the message, send it to the chosen tier and show the answer, time and cost."""
    try:
        routed = route(request.message, settings, force_tier=request.force_tier)
    except RoutingError as error:
        raise HTTPException(
            status_code=STATUS_FOR_KIND.get(error.kind, 502),
            detail={
                "kind": error.kind,
                "message": error.message,
                "complexity": error.rating.level,
                "planned_tier": error.planned_tier,
                "failed_tier": error.tier,
            },
        ) from error

    result = routed.result
    return RouteResponse(
        complexity=routed.rating.level,
        uncertain=routed.rating.uncertain,
        reason=routed.rating.reason,
        planned_tier=routed.planned_tier,
        tier_used=result.tier,
        model=result.model,
        answer=result.text,
        seconds=result.seconds,
        tokens_in=result.tokens_in,
        tokens_out=result.tokens_out,
        estimated_cost_usd=result.estimated_cost_usd,
        actual_cost_usd=result.actual_cost_usd,
        fallback_used=routed.fallback_used,
        fallback_reason=routed.fallback_reason,
    )
