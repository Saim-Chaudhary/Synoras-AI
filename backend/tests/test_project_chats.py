"""Chats inside a project, and the project's name and description reaching the model (FR-13)."""

import pytest

from app.routing.types import Tier
from tests.chat_helpers import LOW, FakeChat, chat_settings, models, register_user, send  # noqa: F401
from tests.project_helpers import make_project

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


def project_chat(client, headers, project_id):
    response = client.post(f"/projects/{project_id}/chats", headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def system_prompt(fake: FakeChat, call: int = 0) -> str:
    return fake.stream_calls[call][0]["content"]


# ---------- listing ----------


def test_a_project_chat_belongs_to_its_project(client, alice):
    project = make_project(client, alice, "Thesis")
    chat = project_chat(client, alice, project["project_id"])
    assert chat["project_id"] == project["project_id"]
    assert chat["title"] == "New chat"

    opened = client.get(f"/chats/{chat['chat_id']}", headers=alice).json()
    assert opened["project"] == {"project_id": project["project_id"], "title": "Thesis"}


def test_project_chats_are_listed_in_the_project_not_in_the_personal_list(client, alice):
    project = make_project(client, alice, "Thesis")
    inside = project_chat(client, alice, project["project_id"])
    personal = client.post("/chats", headers=alice).json()

    in_project = client.get(f"/projects/{project['project_id']}/chats", headers=alice).json()
    assert [c["chat_id"] for c in in_project] == [inside["chat_id"]]

    sidebar = client.get("/chats", headers=alice).json()
    assert [c["chat_id"] for c in sidebar] == [personal["chat_id"]]
    assert sidebar[0]["project_id"] is None

    everything = client.get("/chats?scope=all", headers=alice).json()
    assert {c["chat_id"] for c in everything} == {inside["chat_id"], personal["chat_id"]}


def test_a_personal_chat_has_no_project(client, alice):
    chat = client.post("/chats", headers=alice).json()
    opened = client.get(f"/chats/{chat['chat_id']}", headers=alice).json()
    assert opened["project"] is None and opened["project_id"] is None


def test_the_chat_count_of_a_project(client, alice):
    project = make_project(client, alice, "Counted")
    project_chat(client, alice, project["project_id"])
    project_chat(client, alice, project["project_id"])
    assert client.get(f"/projects/{project['project_id']}", headers=alice).json()["chat_count"] == 2


def test_the_most_recently_active_project_chat_is_first(client, alice, models):
    models[Tier.LOCAL] = FakeChat()
    project = make_project(client, alice, "Order")
    older = project_chat(client, alice, project["project_id"])
    newer = project_chat(client, alice, project["project_id"])
    send(client, alice, older["chat_id"], LOW)  # the older chat is used last, so it moves to the top
    listed = client.get(f"/projects/{project['project_id']}/chats", headers=alice).json()
    assert [c["chat_id"] for c in listed] == [older["chat_id"], newer["chat_id"]]


# ---------- ownership ----------


def test_another_user_cannot_use_my_project_for_chats(client, alice, bob):
    project = make_project(client, alice, "Private")
    chat = project_chat(client, alice, project["project_id"])

    assert client.post(f"/projects/{project['project_id']}/chats", headers=bob).status_code == 404
    assert client.get(f"/projects/{project['project_id']}/chats", headers=bob).status_code == 404
    assert client.get(f"/chats/{chat['chat_id']}", headers=bob).status_code == 404
    assert client.get("/chats?scope=all", headers=bob).json() == []


# ---------- project context for the model (FR-13) ----------


def test_the_project_name_and_description_reach_the_model(client, alice, models):
    fake = FakeChat()
    models[Tier.LOCAL] = fake
    project = make_project(client, alice, "Thesis on GraphRAG", "A final year project about knowledge graphs")
    chat = project_chat(client, alice, project["project_id"])

    status, events = send(client, alice, chat["chat_id"], LOW)
    assert status == 200

    system = system_prompt(fake)
    assert "Thesis on GraphRAG" in system
    assert "A final year project about knowledge graphs" in system
    assert "You are Synoras AI" in system  # the normal instructions are still there
    assert fake.stream_calls[0][-1] == {"role": "user", "content": LOW}  # and the history is unchanged


def test_a_personal_chat_gets_no_project_context(client, alice, models):
    fake = FakeChat()
    models[Tier.LOCAL] = fake
    make_project(client, alice, "Thesis on GraphRAG", "knowledge graphs")
    chat = client.post("/chats", headers=alice).json()

    send(client, alice, chat["chat_id"], LOW)
    system = system_prompt(fake)
    assert "Thesis on GraphRAG" not in system
    assert "project" not in system.lower()


def test_a_project_without_a_description_still_names_the_project(client, alice, models):
    fake = FakeChat()
    models[Tier.LOCAL] = fake
    project = make_project(client, alice, "Just a name")
    chat = project_chat(client, alice, project["project_id"])

    send(client, alice, chat["chat_id"], LOW)
    system = system_prompt(fake)
    assert "Just a name" in system and "description" not in system.lower()


def test_a_long_description_is_cut(client, alice, models):
    fake = FakeChat()
    models[Tier.LOCAL] = fake
    project = make_project(client, alice, "Long", "x" * 2000)
    chat = project_chat(client, alice, project["project_id"])

    send(client, alice, chat["chat_id"], LOW)
    assert system_prompt(fake).count("x") == 1000


def test_the_context_follows_a_rename_and_every_reply_has_it(client, alice, models):
    fake = FakeChat(replies=(("one",), ("two",)))
    models[Tier.LOCAL] = fake
    project = make_project(client, alice, "Before")
    chat = project_chat(client, alice, project["project_id"])

    send(client, alice, chat["chat_id"], LOW)
    client.patch(f"/projects/{project['project_id']}", json={"title": "After"}, headers=alice)
    send(client, alice, chat["chat_id"], LOW)

    assert '"Before"' in system_prompt(fake, 0)
    assert '"After"' in system_prompt(fake, 1)


def test_regenerate_keeps_the_project_context(client, alice, models):
    fake = FakeChat(replies=(("one",), ("two",)))
    models[Tier.LOCAL] = fake
    project = make_project(client, alice, "Kept context", "stays")
    chat = project_chat(client, alice, project["project_id"])

    send(client, alice, chat["chat_id"], LOW)
    send(client, alice, chat["chat_id"], action="regenerate")
    assert "Kept context" in system_prompt(fake, 1)
