import groq
import httpx
import openai
import pytest
from langchain_core.messages import AIMessage

from app.core.config import Settings
from app.routing.model_client import MAX_RETRIES, build_model, call_model
from app.routing.types import ModelCallError, Tier


def make_settings(**overrides) -> Settings:
    values = dict(
        groq_api_key="groq-key",
        groq_model="openai/gpt-oss-20b",
        openrouter_api_key="or-key",
        openrouter_model="nvidia/nemotron-3-ultra-550b-a55b:free",
        ollama_model="llama-test",
        ollama_base_url="http://localhost:11434",
    )
    values.update(overrides)
    return Settings(_env_file=None, **values)  # _env_file=None: ignore the real .env


class FakeModel:
    """Stands in for a LangChain chat model. Each call returns or raises the next outcome."""

    def __init__(self, *outcomes):
        self.outcomes = list(outcomes)
        self.calls = 0

    def invoke(self, prompt):
        self.calls += 1
        outcome = self.outcomes.pop(0)
        if isinstance(outcome, Exception):
            raise outcome
        return outcome


def answer(text="hello", tokens_in=10, tokens_out=20):
    return AIMessage(
        content=text,
        usage_metadata={
            "input_tokens": tokens_in,
            "output_tokens": tokens_out,
            "total_tokens": tokens_in + tokens_out,
        },
    )


def run(tier, fake, settings=None):
    sleeps = []
    result = call_model(
        tier, "hi", settings or make_settings(), factory=lambda t, s: fake, sleep=sleeps.append
    )
    return result, sleeps


def status_error(library, error_name, status):
    request = httpx.Request("POST", "https://example.test")
    response = httpx.Response(status, request=request)
    return getattr(library, error_name)("boom", response=response, body=None)


def connection_error(library):
    return library.APIConnectionError(request=httpx.Request("POST", "https://example.test"))


def test_success_returns_text_tokens_time_and_cost():
    result, _ = run(Tier.SMALL_CLOUD, FakeModel(answer("hello", 1000, 2000)))
    assert result.text == "hello"
    assert result.model == "openai/gpt-oss-20b"
    assert (result.tokens_in, result.tokens_out) == (1000, 2000)
    assert result.estimated_cost_usd == 0.000675
    assert result.actual_cost_usd == 0.0
    assert result.seconds >= 0


def test_local_tier_costs_nothing():
    result, _ = run(Tier.LOCAL, FakeModel(answer()))
    assert result.estimated_cost_usd == 0.0
    assert result.model == "llama-test"


def test_unreachable_cloud_is_retried_then_succeeds():
    fake = FakeModel(connection_error(groq), connection_error(groq), answer("ok"))
    result, sleeps = run(Tier.SMALL_CLOUD, fake)
    assert result.text == "ok"
    assert fake.calls == 3  # first try + 2 retries (FR-21)
    assert len(sleeps) == 2


def test_gives_up_after_two_retries():
    fake = FakeModel(*[connection_error(openai) for _ in range(MAX_RETRIES + 1)])
    with pytest.raises(ModelCallError) as caught:
        run(Tier.STRONG_CLOUD, fake)
    assert caught.value.kind == "unreachable"
    assert fake.calls == MAX_RETRIES + 1


def test_server_error_is_retried():
    fake = FakeModel(status_error(openai, "InternalServerError", 500), answer("ok"))
    result, _ = run(Tier.STRONG_CLOUD, fake)
    assert result.text == "ok"
    assert fake.calls == 2


def test_rate_limit_is_not_retried():
    fake = FakeModel(status_error(groq, "RateLimitError", 429))
    with pytest.raises(ModelCallError) as caught:
        run(Tier.SMALL_CLOUD, fake)
    assert caught.value.kind == "rate_limited"
    assert "Free limit reached" in caught.value.message
    assert fake.calls == 1


def test_rejected_key_is_reported():
    fake = FakeModel(status_error(openai, "AuthenticationError", 401))
    with pytest.raises(ModelCallError) as caught:
        run(Tier.STRONG_CLOUD, fake)
    assert caught.value.kind == "auth"


def test_unknown_model_is_reported():
    fake = FakeModel(status_error(openai, "NotFoundError", 404))
    with pytest.raises(ModelCallError) as caught:
        run(Tier.STRONG_CLOUD, fake)
    assert caught.value.kind == "model_not_found"


def test_ollama_not_running_gives_clear_message_and_no_retry():
    fake = FakeModel(httpx.ConnectError("refused"))
    with pytest.raises(ModelCallError) as caught:
        run(Tier.LOCAL, fake)
    assert caught.value.kind == "unavailable"
    assert "Ollama" in caught.value.message
    assert fake.calls == 1


def test_empty_answer_is_an_error():
    with pytest.raises(ModelCallError) as caught:
        run(Tier.SMALL_CLOUD, FakeModel(answer("   ")))
    assert caught.value.kind == "other"


@pytest.mark.parametrize("tier", list(Tier))
def test_missing_settings_say_what_to_set(tier):
    empty = Settings(_env_file=None, groq_api_key="", openrouter_api_key="")
    with pytest.raises(ModelCallError) as caught:
        build_model(tier, empty)
    assert caught.value.kind == "not_configured"
    assert ".env" in caught.value.message
