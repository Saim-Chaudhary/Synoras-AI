"""Helpers shared by the chat tests: a fake chat model, a reader for Server-Sent Events, and
a way to register users."""

import json

import pytest
from langchain_core.messages import AIMessage, AIMessageChunk

from app.core.config import Settings
from app.routing import model_client
from app.routing.types import ModelCallError, Tier
from tests.conftest import TEST_JWT_SECRET

# Messages that the classifier rates Low, Medium and High (see tests/test_classifier.py).
LOW = "hello"
MEDIUM = "Explain how photosynthesis works"
HIGH = (
    "Analyze the trade-offs between microservices and a monolith and design a "
    "migration plan step by step"
)


def chat_settings() -> Settings:
    """Settings with all three tiers set up, so the tests decide which tier works."""
    return Settings(
        _env_file=None,
        jwt_secret=TEST_JWT_SECRET,
        groq_api_key="groq-key",
        groq_model="openai/gpt-oss-20b",
        openrouter_api_key="or-key",
        openrouter_model="nvidia/nemotron-3-ultra-550b-a55b:free",
        ollama_model="llama-test",
    )


class FakeChat:
    """Stands in for a LangChain chat model. `replies` is a list of replies, one per call:
    each reply is a tuple of pieces. The title is what invoke() returns."""

    def __init__(
        self,
        replies=(("Hello", " there"),),
        usage=(12, 34),
        title="A short title",
        error_before=None,
        error_after=None,  # (number_of_pieces_to_send_first, error)
        title_error=None,
    ):
        self.replies = list(replies)
        self.usage = usage
        self.title = title
        self.error_before = error_before
        self.error_after = error_after
        self.title_error = title_error
        self.stream_calls: list[list[dict]] = []
        self.invoke_calls: list = []

    def stream(self, messages):
        self.stream_calls.append(messages)
        if self.error_before is not None:
            raise self.error_before
        pieces = self.replies[min(len(self.stream_calls), len(self.replies)) - 1]

        def generate():
            for index, piece in enumerate(pieces):
                if self.error_after is not None and index == self.error_after[0]:
                    raise self.error_after[1]
                yield AIMessageChunk(content=piece)
            if self.usage:
                yield AIMessageChunk(
                    content="",
                    usage_metadata={
                        "input_tokens": self.usage[0],
                        "output_tokens": self.usage[1],
                        "total_tokens": sum(self.usage),
                    },
                )

        return generate()

    def invoke(self, prompt):
        self.invoke_calls.append(prompt)
        if self.title_error is not None:
            raise self.title_error
        return AIMessage(content=self.title, usage_metadata={"input_tokens": 5, "output_tokens": 3, "total_tokens": 8})


@pytest.fixture
def models(monkeypatch):
    """A dict tier -> FakeChat (or a ModelCallError for a tier that is unavailable).
    The app builds its models from it instead of calling real providers."""
    table: dict[Tier, object] = {}

    def fake_build_model(tier, settings):
        entry = table[tier]
        if isinstance(entry, Exception):
            raise entry
        return entry

    monkeypatch.setattr(model_client, "build_model", fake_build_model)
    return table


def unavailable(tier: Tier, kind: str = "not_configured", message: str = "not set up") -> ModelCallError:
    return ModelCallError(kind, message, tier)


def read_events(response) -> list[tuple[str | None, dict | None]]:
    """Read a Server-Sent Events response into a list of (event name, data) pairs."""
    events = []
    name = None
    data_lines: list[str] = []
    for line in response.iter_lines():
        if line.startswith("event:"):
            name = line[len("event:") :].strip()
        elif line.startswith("data:"):
            data_lines.append(line[len("data:") :].strip())
        elif line == "":
            if name is not None or data_lines:
                events.append((name, json.loads("\n".join(data_lines)) if data_lines else None))
            name, data_lines = None, []
    return events


def names(events) -> list[str | None]:
    return [name for name, _ in events]


def register_user(client, email: str, name: str = "Test User") -> dict:
    """Register a user and return the headers that log them in."""
    response = client.post("/auth/register", json={"name": name, "email": email, "password": "test-password"})
    assert response.status_code == 201, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def send(client, headers, chat_id: int, text: str | None = None, action: str = "send"):
    """Send a message and return (status code, events)."""
    body: dict = {"action": action}
    if text is not None:
        body["text"] = text
    with client.stream("POST", f"/chats/{chat_id}/messages", json=body, headers=headers) as response:
        if response.status_code != 200:
            response.read()
            return response.status_code, response
        return 200, read_events(response)
