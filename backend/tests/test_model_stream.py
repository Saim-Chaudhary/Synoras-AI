"""StreamedReply: the answer piece by piece, with fake models (no network, no tokens)."""

import httpx
import openai
import pytest
from langchain_core.messages import AIMessageChunk

from app.core.config import Settings
from app.routing.model_client import MAX_RETRIES, StreamedReply
from app.routing.types import ModelCallError, Tier

SETTINGS = Settings(
    _env_file=None,
    groq_api_key="key",
    groq_model="openai/gpt-oss-20b",
    openrouter_api_key="key",
    openrouter_model="nvidia/nemotron-3-ultra-550b-a55b:free",
    ollama_model="llama-test",
)
MESSAGES = [{"role": "system", "content": "be nice"}, {"role": "user", "content": "hello there"}]


class FakeStream:
    """Hands out chunks one by one, and remembers whether it was closed."""

    def __init__(self, chunks, fail_at=None, error=None):
        self.chunks = list(chunks)
        self.fail_at = fail_at
        self.error = error
        self.closed = False

    def __iter__(self):
        return self

    def __next__(self):
        index = len(self.chunks_given)
        if self.fail_at is not None and index == self.fail_at:
            raise self.error
        if index >= len(self.chunks):
            raise StopIteration
        self.chunks_given.append(self.chunks[index])
        return self.chunks[index]

    chunks_given: list

    def close(self):
        self.closed = True


class FakeModel:
    def __init__(self, *streams):
        self.streams = list(streams)
        self.calls = 0

    def stream(self, messages):
        self.calls += 1
        stream = self.streams.pop(0)
        stream.chunks_given = []
        return stream


def pieces(*texts, usage=(10, 20)):
    chunks = [AIMessageChunk(content=text) for text in texts]
    if usage:
        chunks.append(
            AIMessageChunk(
                content="",
                usage_metadata={
                    "input_tokens": usage[0],
                    "output_tokens": usage[1],
                    "total_tokens": sum(usage),
                },
            )
        )
    return chunks


def reply_for(model, tier=Tier.SMALL_CLOUD):
    return StreamedReply(tier, MESSAGES, SETTINGS, factory=lambda t, s: model, sleep=lambda s: None)


def connection_error():
    return openai.APIConnectionError(request=httpx.Request("POST", "https://example.test"))


def test_pieces_arrive_in_order_and_the_result_has_tokens_time_and_cost():
    reply = reply_for(FakeModel(FakeStream(pieces("Hel", "lo ", "world", usage=(1000, 2000)))))
    assert list(reply) == ["Hel", "lo ", "world"]
    assert reply.text == "Hello world"
    result = reply.result
    assert result.text == "Hello world"
    assert (result.tokens_in, result.tokens_out) == (1000, 2000)
    assert result.estimated_cost_usd == 0.000675  # 1000 x $0.075/M + 2000 x $0.30/M
    assert result.actual_cost_usd == 0.0
    assert result.usage_estimated is False
    assert result.seconds >= 0


def test_missing_token_counts_are_estimated_and_flagged():
    reply = reply_for(FakeModel(FakeStream(pieces("x" * 40, usage=None))))
    list(reply)
    assert reply.result.usage_estimated is True
    assert reply.result.tokens_out == 10  # 40 characters / 4


def test_local_tier_costs_nothing():
    reply = reply_for(FakeModel(FakeStream(pieces("hi"))), tier=Tier.LOCAL)
    list(reply)
    assert reply.result.estimated_cost_usd == 0.0


def test_unreachable_provider_is_retried_before_the_first_piece():
    model = FakeModel(
        FakeStream([], fail_at=0, error=connection_error()),
        FakeStream([], fail_at=0, error=connection_error()),
        FakeStream(pieces("ok")),
    )
    reply = reply_for(model)
    assert list(reply) == ["ok"]
    assert model.calls == 3  # first try + 2 retries (FR-21)


def test_gives_up_after_the_retries():
    model = FakeModel(*[FakeStream([], fail_at=0, error=connection_error()) for _ in range(MAX_RETRIES + 1)])
    with pytest.raises(ModelCallError) as caught:
        list(reply_for(model))
    assert caught.value.kind == "unreachable"


def test_nothing_is_retried_once_text_was_shown():
    model = FakeModel(
        FakeStream(pieces("Hello", " wor"), fail_at=2, error=connection_error()),
        FakeStream(pieces("never used")),
    )
    reply = reply_for(model)
    received = []
    with pytest.raises(ModelCallError):
        for piece in reply:
            received.append(piece)
    assert received == ["Hello", " wor"]
    assert reply.text == "Hello wor"  # the text so far is kept for the caller
    assert model.calls == 1
    partial = reply.partial_result()
    assert partial.text == "Hello wor" and partial.usage_estimated is True


def test_rate_limit_is_reported_without_retry():
    response = httpx.Response(429, request=httpx.Request("POST", "https://example.test"))
    error = openai.RateLimitError("slow down", response=response, body=None)
    model = FakeModel(FakeStream([], fail_at=0, error=error))
    with pytest.raises(ModelCallError) as caught:
        list(reply_for(model))
    assert caught.value.kind == "rate_limited"
    assert model.calls == 1


def test_empty_answer_is_an_error():
    with pytest.raises(ModelCallError) as caught:
        list(reply_for(FakeModel(FakeStream(pieces("   ", usage=None)))))
    assert caught.value.kind == "other"


def test_missing_key_says_what_to_set():
    empty = Settings(_env_file=None, groq_api_key="")
    reply = StreamedReply(Tier.SMALL_CLOUD, MESSAGES, empty)
    with pytest.raises(ModelCallError) as caught:
        list(reply)
    assert caught.value.kind == "not_configured"


def test_stopping_early_closes_the_provider_stream():
    stream = FakeStream(pieces("a", "b", "c"))
    reply = reply_for(FakeModel(stream))
    iterator = iter(reply)
    assert next(iterator) == "a"
    iterator.close()  # what happens when the user presses Stop
    assert stream.closed is True
    assert reply.text == "a"
