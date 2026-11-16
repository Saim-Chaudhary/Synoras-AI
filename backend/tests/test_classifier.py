import pytest

from app.routing.classifier import rate
from app.routing.types import Complexity

HARD_MESSAGE = (
    "Analyze the trade-offs between microservices and a monolith and design a "
    "migration plan step by step"
)


@pytest.mark.parametrize(
    "message",
    ["hi", "Hello there", "Thanks!", "What is the capital of France?", "What is 2+2?", "Tell me a joke"],
)
def test_simple_messages_are_low(message):
    assert rate(message).level == Complexity.LOW


@pytest.mark.parametrize(
    "message",
    [
        "Explain how photosynthesis works",
        "Write a Python function to reverse a string",
        "Compare Python and Java",
        "Summarize this: " + "the quick brown fox jumps over the lazy dog " * 3,
    ],
)
def test_ordinary_tasks_are_medium(message):
    assert rate(message).level == Complexity.MEDIUM


def test_hard_task_words_make_high():
    rating = rate(HARD_MESSAGE)
    assert rating.level == Complexity.HIGH
    assert not rating.uncertain


def test_code_plus_debug_is_high():
    assert rate("Debug this:\n```python\nprint(x)\n```").level == Complexity.HIGH


def test_mixed_signals_are_uncertain_and_high():
    rating = rate("What is the best architecture for a chat app?")
    assert rating.level == Complexity.HIGH
    assert rating.uncertain


def test_long_message_without_task_words_is_uncertain_and_high():
    rating = rate("my day was fine and the weather was nice " * 8)
    assert rating.level == Complexity.HIGH
    assert rating.uncertain


def test_empty_message_is_uncertain_and_high():
    rating = rate("   ")
    assert rating.level == Complexity.HIGH
    assert rating.uncertain


def test_classifier_failure_is_high():
    # None has no .lower(), so the rules crash; the answer must still be High (BR-7, 11.0.E2).
    rating = rate(None)  # type: ignore[arg-type]
    assert rating.level == Complexity.HIGH
    assert rating.uncertain
    assert "failed" in rating.reason


def test_reason_explains_the_score():
    assert "score" in rate("Explain how photosynthesis works").reason
