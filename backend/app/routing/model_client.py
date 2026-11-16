"""Calls one of the three model tiers and returns the answer, time and cost (SRS FR-21, SI-4, SI-5).

  Tier.LOCAL         Ollama on this machine
  Tier.SMALL_CLOUD   Groq
  Tier.STRONG_CLOUD  OpenRouter (it speaks the OpenAI protocol, so we use langchain-openai)

Retry rule (FR-21): if a cloud provider cannot be reached, or answers with a server error,
we retry up to 2 times. A rate-limit error is NOT retried: on a free plan the only fix is to wait.
The LangChain clients would retry rate limits on their own, so we set their retries to 0 and
do the retrying here, where it is easy to see.
"""

import time
from collections.abc import Callable
from dataclasses import dataclass

import groq
import httpx
import ollama
import openai
from langchain_groq import ChatGroq
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI

from app.core.config import Settings, get_settings
from app.routing.pricing import estimate_cost
from app.routing.types import ModelCallError, Tier

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
MAX_OUTPUT_TOKENS = 2048  # reasoning models spend tokens "thinking", so leave room
REQUEST_TIMEOUT_SECONDS = 60
MAX_RETRIES = 2  # FR-21
RETRY_BASE_DELAY_SECONDS = 1.0
RETRYABLE_KINDS = {"unreachable", "server_error"}


@dataclass(frozen=True)
class ModelResult:
    text: str
    model: str
    tier: Tier
    seconds: float
    tokens_in: int | None
    tokens_out: int | None
    estimated_cost_usd: float | None
    actual_cost_usd: float | None


def model_name_for(tier: Tier, settings: Settings) -> str:
    return {
        Tier.LOCAL: settings.ollama_model,
        Tier.SMALL_CLOUD: settings.groq_model,
        Tier.STRONG_CLOUD: settings.openrouter_model,
    }[tier]


def build_model(tier: Tier, settings: Settings):
    """Create the LangChain chat model for a tier, or explain what is missing in .env."""
    if tier is Tier.LOCAL:
        if not settings.ollama_model:
            raise ModelCallError(
                "not_configured",
                "Local model not configured: Ollama is not installed yet. "
                "Install it, pull a model, and set OLLAMA_MODEL in backend/.env.",
                tier,
            )
        return ChatOllama(
            model=settings.ollama_model,
            base_url=settings.ollama_base_url,
            num_predict=MAX_OUTPUT_TOKENS,
            client_kwargs={"timeout": REQUEST_TIMEOUT_SECONDS},
        )

    if tier is Tier.SMALL_CLOUD:
        key = settings.groq_api_key.get_secret_value()
        if not key or not settings.groq_model:
            raise ModelCallError(
                "not_configured", "Set GROQ_API_KEY and GROQ_MODEL in backend/.env.", tier
            )
        return ChatGroq(
            model=settings.groq_model,
            api_key=key,
            max_retries=0,
            timeout=REQUEST_TIMEOUT_SECONDS,
            max_tokens=MAX_OUTPUT_TOKENS,
        )

    key = settings.openrouter_api_key.get_secret_value()
    if not key or not settings.openrouter_model:
        raise ModelCallError(
            "not_configured", "Set OPENROUTER_API_KEY and OPENROUTER_MODEL in backend/.env.", tier
        )
    return ChatOpenAI(
        model=settings.openrouter_model,
        api_key=key,
        base_url=OPENROUTER_BASE_URL,
        max_retries=0,
        timeout=REQUEST_TIMEOUT_SECONDS,
        max_tokens=MAX_OUTPUT_TOKENS,
    )


def to_call_error(error: Exception, tier: Tier, settings: Settings) -> ModelCallError:
    """Turn any library exception into a ModelCallError with a plain message."""
    name = model_name_for(tier, settings)
    if isinstance(error, (groq.RateLimitError, openai.RateLimitError)):
        return ModelCallError(
            "rate_limited",
            f"Free limit reached for {name}. Wait a while and try again "
            "(free plans allow few requests per minute and per day).",
            tier,
        )
    if isinstance(error, (groq.AuthenticationError, openai.AuthenticationError)):
        return ModelCallError("auth", f"The API key for {name} was rejected. Check backend/.env.", tier)
    if isinstance(error, (groq.NotFoundError, openai.NotFoundError)):
        return ModelCallError(
            "model_not_found",
            f"The provider does not know the model '{name}'. Free models get removed: "
            "pick another one and change it in backend/.env.",
            tier,
        )
    if isinstance(
        error,
        (groq.APIConnectionError, groq.APITimeoutError, openai.APIConnectionError, openai.APITimeoutError),
    ):
        return ModelCallError("unreachable", f"Could not reach the provider for {name}.", tier)
    if isinstance(error, (groq.APIStatusError, openai.APIStatusError)) and error.status_code >= 500:
        return ModelCallError("server_error", f"The provider for {name} had an error.", tier)
    if isinstance(error, httpx.ConnectError) and tier is Tier.LOCAL:
        return ModelCallError(
            "unavailable",
            f"Local model not available: cannot connect to Ollama at {settings.ollama_base_url}. "
            "Install Ollama and start it.",
            tier,
        )
    if isinstance(error, ollama.ResponseError) and error.status_code == 404:
        return ModelCallError(
            "model_not_found",
            f"Ollama does not have the model '{name}'. Run: ollama pull {name}",
            tier,
        )
    return ModelCallError("other", f"Model call failed ({type(error).__name__}): {error}", tier)


def _text_of(response) -> str:
    return (response.text or "").strip()


def call_model(
    tier: Tier,
    prompt: str,
    settings: Settings | None = None,
    *,
    factory: Callable = build_model,
    sleep: Callable[[float], None] = time.sleep,
) -> ModelResult:
    """Send one prompt to a tier. Raises ModelCallError when it cannot be answered."""
    settings = settings or get_settings()
    model = factory(tier, settings)
    started = time.perf_counter()

    for attempt in range(MAX_RETRIES + 1):
        try:
            response = model.invoke(prompt)
            break
        except ModelCallError:
            raise
        except Exception as error:
            call_error = to_call_error(error, tier, settings)
            if call_error.kind not in RETRYABLE_KINDS or attempt == MAX_RETRIES:
                raise call_error from error
            sleep(RETRY_BASE_DELAY_SECONDS * 2**attempt)

    seconds = round(time.perf_counter() - started, 3)
    text = _text_of(response)
    if not text:
        raise ModelCallError(
            "other",
            "The model returned an empty answer (it may have used all its tokens thinking). "
            "Try again.",
            tier,
        )

    usage = getattr(response, "usage_metadata", None) or {}
    tokens_in = usage.get("input_tokens")
    tokens_out = usage.get("output_tokens")
    name = model_name_for(tier, settings)
    cost = estimate_cost(name, tokens_in, tokens_out, local=tier is Tier.LOCAL)
    return ModelResult(
        text=text,
        model=name,
        tier=tier,
        seconds=seconds,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        estimated_cost_usd=cost.estimated_usd,
        actual_cost_usd=cost.actual_usd,
    )
