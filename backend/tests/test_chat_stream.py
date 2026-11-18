"""POST /chats/{id}/messages: the streamed reply, with fake models (no network, no tokens)."""

from contextlib import nullcontext

import httpx
import openai
import pytest
from sqlalchemy import func, select

from app.models.chat import Chat, Message, Subtask
from app.routing.types import ModelCallError, Tier
from app.services import chat_service
from app.services.chat_stream import stream_reply
from tests.chat_helpers import (
    HIGH,
    LOW,
    MEDIUM,
    FakeChat,
    chat_settings,
    models,  # noqa: F401  (a fixture)
    names,
    register_user,
    send,
    unavailable,
)

pytestmark = pytest.mark.integration


@pytest.fixture
def test_settings():
    return chat_settings()


@pytest.fixture
def alice(client):
    return register_user(client, "alice@example.com", "Alice")


@pytest.fixture
def chat_id(client, alice):
    return client.post("/chats", headers=alice).json()["chat_id"]


_FIRST_ID: dict = {}


def _key(model):
    return model.__table__.primary_key.columns.values()[0]


@pytest.fixture(autouse=True)
def _ignore_rows_that_were_there_before(db_session):
    """The development database may already hold chats (from trying the app by hand).
    `rows()` only returns rows created during the running test."""
    for model in (Message, Subtask):
        _FIRST_ID[model] = db_session.scalar(select(func.coalesce(func.max(_key(model)), 0)))


def rows(db_session, model, *conditions):
    db_session.expire_all()
    key = _key(model)
    return list(db_session.scalars(select(model).where(key > _FIRST_ID.get(model, 0), *conditions).order_by(key)))


def rate_limit_error():
    response = httpx.Response(429, request=httpx.Request("POST", "https://example.test"))
    return openai.RateLimitError("slow down", response=response, body=None)


def connection_error():
    return openai.APIConnectionError(request=httpx.Request("POST", "https://example.test"))


# ---------- the stream and what it saves ----------


def test_the_stream_has_the_expected_events_and_saves_everything(client, alice, chat_id, models, db_session):
    models[Tier.LOCAL] = FakeChat(replies=(("Hello", " there", "!"),), title="Greeting")

    status, events = send(client, alice, chat_id, LOW)

    assert status == 200
    assert names(events) == ["start", "token", "token", "token", "done", "title"]
    start = events[0][1]
    assert start["complexity"] == "Low" and start["planned_tier"] == "local"
    assert "".join(data["text"] for name, data in events if name == "token") == "Hello there!"

    done = dict(events)["done"]
    assert done["tier"] == "local" and done["planned_tier"] == "local"
    assert done["model"] == "llama-test"
    assert done["fallback_used"] is False
    assert done["seconds"] >= 0
    assert (done["tokens_in"], done["tokens_out"]) == (12, 34)
    assert done["estimated_cost_usd"] == 0.0 and done["actual_cost_usd"] == 0.0
    assert dict(events)["title"]["title"] == "Greeting"

    opened = client.get(f"/chats/{chat_id}", headers=alice).json()
    assert opened["title"] == "Greeting"
    user, reply = opened["messages"]
    assert (user["sender"], user["text"]) == ("user", LOW)
    assert (reply["sender"], reply["text"], reply["model_used"]) == ("assistant", "Hello there!", "llama-test")
    assert reply["routing"]["tier"] == "local" and reply["routing"]["complexity"] == "Low"
    assert reply["routing"]["seconds"] == done["seconds"]

    log = rows(db_session, Subtask)
    assert [(s.kind, s.complexity, s.tier, s.model_used) for s in log] == [
        ("reply", "Low", "local", "llama-test"),
        ("title", "Low", "local", "llama-test"),
    ]
    assert log[0].message_id == reply["message_id"] == done["message_id"]
    assert log[0].response_time == done["seconds"] and log[0].cost == 0.0


@pytest.mark.parametrize(
    ("message", "tier", "model"),
    [
        (LOW, "local", "llama-test"),
        (MEDIUM, "small_cloud", "openai/gpt-oss-20b"),
        (HIGH, "strong_cloud", "nvidia/nemotron-3-ultra-550b-a55b:free"),
    ],
)
def test_the_classifier_picks_the_tier(client, alice, chat_id, models, message, tier, model):
    for each in Tier:
        models[each] = FakeChat()
    _, events = send(client, alice, chat_id, message)
    done = dict(events)["done"]
    assert (done["tier"], done["model"]) == (tier, model)


def test_cost_is_estimated_from_the_tokens_and_the_model_price(client, alice, chat_id, models):
    models[Tier.SMALL_CLOUD] = FakeChat(usage=(1000, 2000))
    models[Tier.LOCAL] = FakeChat()
    _, events = send(client, alice, chat_id, MEDIUM)
    done = dict(events)["done"]
    assert done["estimated_cost_usd"] == 0.000675 and done["actual_cost_usd"] == 0.0


# ---------- history sent to the model (FR-3) ----------


def test_earlier_messages_are_sent_as_context(client, alice, chat_id, models):
    fake = FakeChat(replies=(("first answer",), ("second answer",)))
    models[Tier.LOCAL] = fake
    send(client, alice, chat_id, "hello")
    send(client, alice, chat_id, "hello again")

    second_prompt = fake.stream_calls[1]
    assert [m["role"] for m in second_prompt] == ["system", "user", "assistant", "user"]
    assert [m["content"] for m in second_prompt[1:]] == ["hello", "first answer", "hello again"]


def test_a_long_history_is_cut_to_the_last_messages(client, alice, chat_id, models, db_session):
    for number in range(30):
        db_session.add(Message(chat_id=chat_id, sender="user" if number % 2 == 0 else "assistant", text=f"old {number}"))
    db_session.commit()
    fake = FakeChat()
    models[Tier.LOCAL] = fake

    send(client, alice, chat_id, "hello")

    prompt = fake.stream_calls[0]
    assert prompt[0]["role"] == "system"
    assert len(prompt) - 1 <= chat_service.HISTORY_MAX_MESSAGES
    assert prompt[-1]["content"] == "hello"  # the new message is always there
    assert "old 0" not in [m["content"] for m in prompt]  # the oldest are dropped


def test_a_very_long_history_is_cut_to_the_size_limit(client, alice, chat_id, models, db_session):
    for number in range(6):
        db_session.add(Message(chat_id=chat_id, sender="user" if number % 2 == 0 else "assistant", text="x" * 3000))
    db_session.commit()
    fake = FakeChat()
    models[Tier.LOCAL] = fake

    send(client, alice, chat_id, "hello")

    prompt = fake.stream_calls[0]
    assert sum(len(m["content"]) for m in prompt[1:]) <= chat_service.HISTORY_MAX_CHARS + len("hello")
    assert prompt[-1]["content"] == "hello"
    assert prompt[1]["role"] == "user"  # the context starts with the user, not with a reply


# ---------- fallback to the next tier up (decisions A24) ----------


def test_local_not_installed_falls_back_to_the_small_cloud_tier_and_says_so(client, alice, chat_id, models, db_session):
    models[Tier.LOCAL] = unavailable(Tier.LOCAL, "not_configured", "Ollama is not installed")
    models[Tier.SMALL_CLOUD] = FakeChat(replies=(("From", " groq"),), title="Fallback title")

    _, events = send(client, alice, chat_id, LOW)

    assert names(events) == ["start", "fallback", "token", "token", "done", "title"]
    fallback = dict(events)["fallback"]
    assert (fallback["from_tier"], fallback["to_tier"]) == ("local", "small_cloud")
    assert "Ollama is not installed" in fallback["reason"]
    done = dict(events)["done"]
    assert done["planned_tier"] == "local" and done["tier"] == "small_cloud"
    assert done["fallback_used"] is True

    reply = [s for s in rows(db_session, Subtask) if s.kind == "reply"][0]
    assert reply.tier == "small_cloud"
    assert "Planned local" in reply.note and "Ollama is not installed" in reply.note  # noted in the log
    title_row = [s for s in rows(db_session, Subtask) if s.kind == "title"][0]
    assert title_row.tier == "small_cloud"  # the title also fell back


def test_a_rate_limited_tier_falls_back_up(client, alice, chat_id, models):
    models[Tier.LOCAL] = FakeChat()
    models[Tier.SMALL_CLOUD] = FakeChat(error_before=rate_limit_error())
    models[Tier.STRONG_CLOUD] = FakeChat(replies=(("strong answer",),))

    _, events = send(client, alice, chat_id, MEDIUM)

    done = dict(events)["done"]
    assert done["planned_tier"] == "small_cloud" and done["tier"] == "strong_cloud"
    assert "Free limit reached" in dict(events)["fallback"]["reason"]


def test_an_unreachable_provider_is_retried_then_falls_back(client, alice, chat_id, models):
    unreachable = FakeChat(error_before=connection_error())
    models[Tier.LOCAL] = FakeChat()
    models[Tier.SMALL_CLOUD] = unreachable
    models[Tier.STRONG_CLOUD] = FakeChat()

    _, events = send(client, alice, chat_id, MEDIUM)

    assert dict(events)["done"]["tier"] == "strong_cloud"
    assert len(unreachable.stream_calls) == 3  # first try + 2 retries


def test_no_model_available_gives_a_clear_error_and_keeps_the_message(client, alice, chat_id, models):
    models[Tier.LOCAL] = unavailable(Tier.LOCAL, "unavailable", "Ollama is not running")
    models[Tier.SMALL_CLOUD] = unavailable(Tier.SMALL_CLOUD, "not_configured", "Set GROQ_API_KEY")
    models[Tier.STRONG_CLOUD] = FakeChat(error_before=rate_limit_error())

    status, events = send(client, alice, chat_id, LOW)

    assert status == 200  # an error event, not a crash
    assert names(events) == ["start", "fallback", "fallback", "error"]
    error = dict(events)["error"]
    assert error["partial_saved"] is False
    for expected in ("local", "small_cloud", "strong_cloud", "Ollama is not running", "Set GROQ_API_KEY", "Free limit reached"):
        assert expected in error["message"]

    opened = client.get(f"/chats/{chat_id}", headers=alice).json()
    assert [(m["sender"], m["text"]) for m in opened["messages"]] == [("user", LOW)]  # the message is kept (FR-3)


def test_the_top_tier_failing_is_an_error_without_a_fallback(client, alice, chat_id, models):
    models[Tier.STRONG_CLOUD] = FakeChat(error_before=rate_limit_error())
    _, events = send(client, alice, chat_id, HIGH)
    assert names(events) == ["start", "error"]
    assert dict(events)["error"]["kind"] == "rate_limited"
    assert "Free limit reached" in dict(events)["error"]["message"]


def test_a_wrong_key_is_reported_clearly(client, alice, chat_id, models):
    response = httpx.Response(401, request=httpx.Request("POST", "https://example.test"))
    models[Tier.STRONG_CLOUD] = FakeChat(error_before=openai.AuthenticationError("bad key", response=response, body=None))
    _, events = send(client, alice, chat_id, HIGH)
    assert dict(events)["error"]["kind"] == "auth"
    assert "rejected" in dict(events)["error"]["message"]


def test_an_empty_model_answer_is_an_error_not_a_blank_reply(client, alice, chat_id, models):
    models[Tier.LOCAL] = FakeChat(replies=((" ",),), usage=None)
    _, events = send(client, alice, chat_id, LOW)
    assert dict(events)["error"]["kind"] == "other"
    assert [m["sender"] for m in client.get(f"/chats/{chat_id}", headers=alice).json()["messages"]] == ["user"]


# ---------- interruptions ----------


def test_a_failure_in_the_middle_keeps_the_text_so_far(client, alice, chat_id, models, db_session):
    models[Tier.LOCAL] = FakeChat(replies=(("Hello", " wor", "ld"),), error_after=(2, connection_error()))
    models[Tier.SMALL_CLOUD] = FakeChat(replies=(("must not be used",),))

    _, events = send(client, alice, chat_id, LOW)

    assert names(events) == ["start", "token", "token", "error"]  # no fallback once text was shown
    error = dict(events)["error"]
    assert error["partial_saved"] is True and "interrupted" in error["message"]

    reply = client.get(f"/chats/{chat_id}", headers=alice).json()["messages"][1]
    assert reply["text"] == "Hello wor"
    assert "Interrupted" in reply["routing"]["note"]


def test_stopping_the_stream_saves_what_the_user_already_saw(client, alice, chat_id, models, db_session):
    models[Tier.LOCAL] = FakeChat(replies=(("one ", "two ", "three ", "four"),))
    user = client.get("/auth/me", headers=alice).json()
    chat = db_session.get(Chat, chat_id)
    turn = chat_service.prepare_turn(db_session, user["user_id"], chat, "send", LOW)

    stream = stream_reply(turn, chat_settings(), lambda: nullcontext(db_session))
    assert next(stream).event == "start"
    assert next(stream).data == {"text": "one "}
    assert next(stream).data == {"text": "two "}
    stream.close()  # this is what happens when the browser's Stop button closes the connection

    replies = [m for m in rows(db_session, Message, Message.chat_id == chat_id) if m.sender == "assistant"]
    assert [r.text for r in replies] == ["one two"]
    note = rows(db_session, Subtask)[0].note
    assert "Stopped" in note


# ---------- regenerate, edit, validation ----------


def test_regenerate_replaces_the_last_reply(client, alice, chat_id, models, db_session):
    models[Tier.LOCAL] = FakeChat(replies=(("first try",), ("second try",)))
    _, first = send(client, alice, chat_id, LOW)
    old_id = dict(first)["done"]["message_id"]

    status, events = send(client, alice, chat_id, action="regenerate")

    assert status == 200 and "done" in names(events)
    messages = client.get(f"/chats/{chat_id}", headers=alice).json()["messages"]
    assert [(m["sender"], m["text"]) for m in messages] == [("user", LOW), ("assistant", "second try")]
    assert old_id not in [m["message_id"] for m in messages]
    assert [s.message_id for s in rows(db_session, Subtask) if s.kind == "reply"] == [messages[1]["message_id"]]


def test_regenerate_works_after_a_failed_attempt(client, alice, chat_id, models):
    models[Tier.LOCAL] = unavailable(Tier.LOCAL, "unavailable", "down")
    models[Tier.SMALL_CLOUD] = unavailable(Tier.SMALL_CLOUD)
    models[Tier.STRONG_CLOUD] = unavailable(Tier.STRONG_CLOUD)
    assert "error" in names(send(client, alice, chat_id, LOW)[1])

    models[Tier.LOCAL] = FakeChat(replies=(("back again",),))
    _, events = send(client, alice, chat_id, action="regenerate")  # the "retry" of FR-3

    assert "done" in names(events)
    messages = client.get(f"/chats/{chat_id}", headers=alice).json()["messages"]
    assert [(m["sender"], m["text"]) for m in messages] == [("user", LOW), ("assistant", "back again")]


def test_edit_changes_the_last_user_message_and_answers_again(client, alice, chat_id, models):
    fake = FakeChat(replies=(("answer to hello",), ("answer to the edit",)))
    models[Tier.LOCAL] = fake
    send(client, alice, chat_id, LOW)

    status, events = send(client, alice, chat_id, "hello, edited", action="edit")

    assert status == 200 and "done" in names(events)
    messages = client.get(f"/chats/{chat_id}", headers=alice).json()["messages"]
    assert [(m["sender"], m["text"]) for m in messages] == [("user", "hello, edited"), ("assistant", "answer to the edit")]
    assert fake.stream_calls[1][-1]["content"] == "hello, edited"


def test_edit_only_touches_the_last_user_message(client, alice, chat_id, models):
    models[Tier.LOCAL] = FakeChat(replies=(("a1",), ("a2",), ("a2 edited",)))
    send(client, alice, chat_id, "hello")
    send(client, alice, chat_id, "hello again")
    send(client, alice, chat_id, "hello again, edited", action="edit")
    messages = client.get(f"/chats/{chat_id}", headers=alice).json()["messages"]
    assert [m["text"] for m in messages] == ["hello", "a1", "hello again, edited", "a2 edited"]


def test_regenerate_or_edit_in_an_empty_chat_is_a_409(client, alice, chat_id, models):
    models[Tier.LOCAL] = FakeChat()
    assert send(client, alice, chat_id, action="regenerate")[0] == 409
    assert send(client, alice, chat_id, "text", action="edit")[0] == 409


@pytest.mark.parametrize("text", [None, "", "   \n  "])
def test_an_empty_message_is_not_sent(client, alice, chat_id, models, text):
    models[Tier.LOCAL] = FakeChat()
    status, response = send(client, alice, chat_id, text)
    assert status == 422
    assert "empty" in response.text.lower()
    assert client.get(f"/chats/{chat_id}", headers=alice).json()["messages"] == []


def test_an_empty_edit_is_rejected_and_changes_nothing(client, alice, chat_id, models):
    models[Tier.LOCAL] = FakeChat()
    send(client, alice, chat_id, LOW)
    assert send(client, alice, chat_id, "  ", action="edit")[0] == 422
    messages = client.get(f"/chats/{chat_id}", headers=alice).json()["messages"]
    assert [m["text"] for m in messages][0] == LOW and len(messages) == 2


def test_a_message_that_is_too_long_is_rejected(client, alice, chat_id, models):
    models[Tier.LOCAL] = FakeChat()
    assert send(client, alice, chat_id, "x" * 8001)[0] == 422


def test_sending_needs_a_login(client, chat_id, models):
    models[Tier.LOCAL] = FakeChat()
    response = client.post(f"/chats/{chat_id}/messages", json={"text": "hi"})
    assert response.status_code == 401


# ---------- titles (decisions A24) ----------


def test_the_title_is_only_made_after_the_first_message(client, alice, chat_id, models):
    fake = FakeChat(replies=(("a1",), ("a2",)), title="First title")
    models[Tier.LOCAL] = fake
    _, first = send(client, alice, chat_id, "hello")
    _, second = send(client, alice, chat_id, "hello again")
    assert "title" in names(first)
    assert "title" not in names(second)
    assert len(fake.invoke_calls) == 1


def test_a_title_the_user_chose_is_never_replaced(client, alice, models):
    chat_id = client.post("/chats", json={"title": "My own title"}, headers=alice).json()["chat_id"]
    fake = FakeChat()
    models[Tier.LOCAL] = fake
    _, events = send(client, alice, chat_id, "hello")
    assert "title" not in names(events)
    assert fake.invoke_calls == []  # no model call was spent on it
    assert client.get(f"/chats/{chat_id}", headers=alice).json()["title"] == "My own title"


def test_if_the_title_model_fails_the_title_is_the_start_of_the_message(client, alice, chat_id, models):
    models[Tier.LOCAL] = FakeChat(title_error=ModelCallError("other", "no title today", Tier.LOCAL))
    _, events = send(client, alice, chat_id, "hello there my friend")
    assert dict(events)["title"]["title"] == "hello there my friend"
    assert "done" in names(events)  # the answer was not affected


def test_a_messy_title_from_the_model_is_cleaned(client, alice, chat_id, models):
    models[Tier.LOCAL] = FakeChat(title='"**Trip planning for Lahore.**"\nHere is why...')
    _, events = send(client, alice, chat_id, "hello")
    assert dict(events)["title"]["title"] == "Trip planning for Lahore"


# ---------- privacy ----------


def test_user_b_cannot_stream_into_user_as_chat(client, alice, chat_id, models):
    models[Tier.LOCAL] = FakeChat()
    bob = register_user(client, "bob@example.com", "Bob")
    status, response = send(client, bob, chat_id, "hello")
    assert status == 404
    assert client.get(f"/chats/{chat_id}", headers=alice).json()["messages"] == []
