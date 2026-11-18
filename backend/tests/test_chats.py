"""Chats: create, list, open, rename, delete, search, and that nobody sees another user's chats."""

import pytest
from sqlalchemy import select

from app.models.chat import Chat, Message
from tests.chat_helpers import chat_settings, register_user

pytestmark = pytest.mark.integration


@pytest.fixture
def test_settings():
    return chat_settings()


@pytest.fixture
def alice(client):
    return register_user(client, "alice@example.com", "Alice")


@pytest.fixture
def bob(client):
    return register_user(client, "bob@example.com", "Bob")


def make_chat(client, headers, title=None):
    response = client.post("/chats", json={"title": title} if title else None, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def add_message(db_session, chat_id, text, sender="user"):
    db_session.add(Message(chat_id=chat_id, sender=sender, text=text))
    db_session.commit()


# ---------- create, list, open ----------


def test_a_new_chat_is_called_new_chat(client, alice):
    chat = make_chat(client, alice)
    assert chat["title"] == "New chat"
    assert chat["chat_id"] > 0


def test_a_chat_can_start_with_a_title(client, alice):
    assert make_chat(client, alice, "Trip plan")["title"] == "Trip plan"


def test_chats_are_listed_newest_first(client, alice):
    first = make_chat(client, alice, "first")
    second = make_chat(client, alice, "second")
    third = make_chat(client, alice, "third")
    listed = client.get("/chats", headers=alice).json()
    assert [chat["chat_id"] for chat in listed] == [third["chat_id"], second["chat_id"], first["chat_id"]]


def test_a_chat_with_a_new_message_moves_to_the_top(client, alice, db_session):
    older = make_chat(client, alice, "older")
    make_chat(client, alice, "newer")
    chat = db_session.get(Chat, older["chat_id"])
    from app.services.chat_service import now

    chat.updated_at = now()  # activity in the older chat
    db_session.commit()
    assert client.get("/chats", headers=alice).json()[0]["chat_id"] == older["chat_id"]


def test_opening_a_chat_returns_its_messages_in_order(client, alice, db_session):
    chat = make_chat(client, alice)
    add_message(db_session, chat["chat_id"], "question")
    add_message(db_session, chat["chat_id"], "answer", sender="assistant")
    opened = client.get(f"/chats/{chat['chat_id']}", headers=alice).json()
    assert [(m["sender"], m["text"]) for m in opened["messages"]] == [("user", "question"), ("assistant", "answer")]


def test_listing_needs_a_login(client):
    assert client.get("/chats").status_code == 401
    assert client.post("/chats").status_code == 401


# ---------- privacy: only my own chats ----------


def test_users_only_see_their_own_chats_in_the_list(client, alice, bob):
    make_chat(client, alice, "alice chat")
    make_chat(client, bob, "bob chat")
    assert [c["title"] for c in client.get("/chats", headers=alice).json()] == ["alice chat"]
    assert [c["title"] for c in client.get("/chats", headers=bob).json()] == ["bob chat"]


def test_user_a_cannot_read_user_bs_chat(client, alice, bob, db_session):
    secret = make_chat(client, bob, "bob's private chat")
    add_message(db_session, secret["chat_id"], "bob's secret message")
    response = client.get(f"/chats/{secret['chat_id']}", headers=alice)
    assert response.status_code == 404  # "not found", the same as a chat that does not exist
    assert "secret" not in response.text


def test_user_a_cannot_rename_delete_or_write_in_user_bs_chat(client, alice, bob, db_session):
    chat = make_chat(client, bob, "bob chat")
    chat_id = chat["chat_id"]
    assert client.patch(f"/chats/{chat_id}", json={"title": "hacked"}, headers=alice).status_code == 404
    assert client.delete(f"/chats/{chat_id}", headers=alice).status_code == 404
    response = client.post(f"/chats/{chat_id}/messages", json={"text": "hi"}, headers=alice)
    assert response.status_code == 404

    db_session.expire_all()
    still_there = db_session.get(Chat, chat_id)
    assert still_there.title == "bob chat"  # nothing changed
    assert db_session.scalars(select(Message).where(Message.chat_id == chat_id)).all() == []


def test_a_chat_that_does_not_exist_is_404(client, alice):
    assert client.get("/chats/999999", headers=alice).status_code == 404


# ---------- rename and delete ----------


def test_rename(client, alice):
    chat = make_chat(client, alice)
    response = client.patch(f"/chats/{chat['chat_id']}", json={"title": "  My new title  "}, headers=alice)
    assert response.status_code == 200
    assert response.json()["title"] == "My new title"
    assert client.get(f"/chats/{chat['chat_id']}", headers=alice).json()["title"] == "My new title"


@pytest.mark.parametrize("title", ["", "   ", "x" * 151])
def test_rename_rejects_empty_and_too_long_titles(client, alice, title):
    chat = make_chat(client, alice, "keep me")
    response = client.patch(f"/chats/{chat['chat_id']}", json={"title": title}, headers=alice)
    assert response.status_code == 422
    assert client.get(f"/chats/{chat['chat_id']}", headers=alice).json()["title"] == "keep me"


def test_delete_removes_the_chat_and_its_messages(client, alice, db_session):
    chat = make_chat(client, alice)
    add_message(db_session, chat["chat_id"], "hello")
    assert client.delete(f"/chats/{chat['chat_id']}", headers=alice).status_code == 204
    assert client.get(f"/chats/{chat['chat_id']}", headers=alice).status_code == 404
    assert client.get("/chats", headers=alice).json() == []
    db_session.expire_all()
    assert db_session.scalars(select(Message).where(Message.chat_id == chat["chat_id"])).all() == []


def test_deleting_twice_is_404(client, alice):
    chat = make_chat(client, alice)
    assert client.delete(f"/chats/{chat['chat_id']}", headers=alice).status_code == 204
    assert client.delete(f"/chats/{chat['chat_id']}", headers=alice).status_code == 404


# ---------- search ----------


def search(client, headers, q):
    response = client.get("/chats", params={"q": q}, headers=headers)
    assert response.status_code == 200
    return [chat["title"] for chat in response.json()]


def test_search_finds_a_chat_by_title(client, alice):
    make_chat(client, alice, "Holiday in Lahore")
    make_chat(client, alice, "Homework help")
    assert search(client, alice, "lahore") == ["Holiday in Lahore"]  # capitals do not matter


def test_search_finds_a_chat_by_message_text(client, alice, db_session):
    chat = make_chat(client, alice, "Untitled")
    make_chat(client, alice, "Something else")
    add_message(db_session, chat["chat_id"], "How do I bake sourdough bread?")
    add_message(db_session, chat["chat_id"], "Use a warm kitchen.", sender="assistant")
    assert search(client, alice, "SOURDOUGH") == ["Untitled"]
    assert search(client, alice, "warm kitchen") == ["Untitled"]


def test_search_returns_each_chat_once_even_if_many_messages_match(client, alice, db_session):
    chat = make_chat(client, alice, "Cats")
    for _ in range(3):
        add_message(db_session, chat["chat_id"], "cats cats cats")
    assert search(client, alice, "cats") == ["Cats"]


def test_search_with_no_match_is_an_empty_list(client, alice):
    make_chat(client, alice, "Something")
    assert search(client, alice, "zzzz") == []


def test_percent_and_underscore_are_not_wildcards(client, alice):
    make_chat(client, alice, "100% sure")
    make_chat(client, alice, "plain title")
    assert search(client, alice, "%") == ["100% sure"]
    assert search(client, alice, "_") == []  # no title contains an underscore


def test_search_never_returns_another_users_chats(client, alice, bob, db_session):
    secret = make_chat(client, bob, "Quantum secrets")
    add_message(db_session, secret["chat_id"], "the launch code is 1234")
    assert search(client, alice, "quantum") == []
    assert search(client, alice, "launch code") == []
    assert search(client, bob, "launch code") == ["Quantum secrets"]
