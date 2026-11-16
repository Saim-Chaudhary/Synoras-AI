"""Price table and cost estimate (SRS Assumption 2: cost is estimated from published token prices).

We use free models, so the money we really pay is $0. The *estimated* cost is what the same
tokens would cost at the model's published paid price. The routing log (FR-22) and the saving
compared with "always use the strongest model" (FR-23, PER-10) need that number.

Prices are US dollars per 1 million tokens. Checked on 2026-11-17 against the Groq docs
(console.groq.com/docs/models) and the OpenRouter catalogue (openrouter.ai/api/v1/models).
If you change a model in .env, add its row here, or its cost shows as None.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Price:
    input_per_million: float  # published paid price for input tokens
    output_per_million: float  # published paid price for output tokens
    free: bool  # True when we run it on a free plan, so the real cost is $0


PRICES: dict[str, Price] = {
    # Groq (smaller cloud tier). Assumes the Groq free plan; confirm in your Groq console.
    "openai/gpt-oss-20b": Price(0.075, 0.30, free=True),
    "openai/gpt-oss-120b": Price(0.15, 0.60, free=True),
    # OpenRouter free models (stronger cloud tier). The price is that of the paid twin.
    "nvidia/nemotron-3-ultra-550b-a55b:free": Price(0.60, 2.40, free=True),
    "google/gemma-4-31b-it:free": Price(0.20, 0.40, free=True),
}


@dataclass(frozen=True)
class Cost:
    estimated_usd: float | None  # tokens x published paid price
    actual_usd: float | None  # what we really pay (0 on free plans)


def estimate_cost(
    model: str, tokens_in: int | None, tokens_out: int | None, *, local: bool = False
) -> Cost:
    """Return the estimated and actual cost of one call. Unknown values give None, not a guess."""
    if local:
        return Cost(estimated_usd=0.0, actual_usd=0.0)  # runs on your own machine
    price = PRICES.get(model)
    if price is None or tokens_in is None or tokens_out is None:
        return Cost(estimated_usd=None, actual_usd=None)
    estimated = (
        tokens_in * price.input_per_million + tokens_out * price.output_per_million
    ) / 1_000_000
    return Cost(
        estimated_usd=round(estimated, 6),
        actual_usd=0.0 if price.free else round(estimated, 6),
    )
