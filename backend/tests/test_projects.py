"""Projects: create, list, open, rename, delete, duplicate names, ownership (FR-11, UC-5, BR-13, BR-14)."""

import pytest
from sqlalchemy import select

from app.models.chat import Chat, Message
from app.models.project import Project, ProjectNote, Task
from tests.chat_helpers import chat_settings, register_user
from tests.project_helpers import make_note, make_project, make_task

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


# ---------- create, list, open ----------


def test_create_a_project_and_open_it(client, alice):
    created = make_project(client, alice, "  Thesis  ", "My final year thesis")
    assert created["title"] == "Thesis"  # spaces around the name are removed
    assert created["description"] == "My final year thesis"
    assert created["progress"] == {"total": 0, "todo": 0, "in_progress": 0, "done": 0, "percent_done": 0}
    assert created["chat_count"] == 0

    opened = client.get(f"/projects/{created['project_id']}", headers=alice)
    assert opened.status_code == 200
    assert opened.json()["title"] == "Thesis"


def test_the_description_is_optional(client, alice):
    response = client.post("/projects", json={"title": "No description"}, headers=alice)
    assert response.status_code == 201
    assert response.json()["description"] == ""


def test_list_projects_newest_first_with_progress(client, alice):
    first = make_project(client, alice, "First")
    second = make_project(client, alice, "Second")
    make_task(client, alice, first["project_id"])

    listed = client.get("/projects", headers=alice).json()
    assert [p["title"] for p in listed] == ["Second", "First"]
    by_title = {p["title"]: p for p in listed}
    assert by_title["First"]["progress"]["total"] == 1
    assert by_title["Second"]["progress"]["total"] == 0
    assert second["project_id"] == listed[0]["project_id"]


def test_every_endpoint_needs_a_login(client):
    assert client.get("/projects").status_code == 401
    assert client.post("/projects", json={"title": "x"}).status_code == 401
    assert client.get("/projects/1").status_code == 401
    assert client.get("/projects/1/tasks").status_code == 401
    assert client.get("/projects/1/notes").status_code == 401
    assert client.post("/projects/1/chats").status_code == 401


# ---------- names ----------


@pytest.mark.parametrize("title", ["", "   "])
def test_an_empty_name_is_rejected(client, alice, title):
    response = client.post("/projects", json={"title": title}, headers=alice)
    assert response.status_code == 422


def test_a_name_over_150_characters_is_rejected(client, alice):
    assert client.post("/projects", json={"title": "x" * 151}, headers=alice).status_code == 422


def test_a_used_name_is_rejected_even_with_other_capitals(client, alice):
    make_project(client, alice, "Thesis")
    response = client.post("/projects", json={"title": "  THESIS "}, headers=alice)
    assert response.status_code == 409
    assert "already have a project" in response.json()["detail"]
    assert len(client.get("/projects", headers=alice).json()) == 1


def test_two_users_can_use_the_same_name(client, alice, bob):
    make_project(client, alice, "Thesis")
    make_project(client, bob, "Thesis")
    assert len(client.get("/projects", headers=bob).json()) == 1


# ---------- rename and edit ----------


def test_rename_and_change_the_description(client, alice):
    project = make_project(client, alice, "Old name", "old")
    url = f"/projects/{project['project_id']}"

    renamed = client.patch(url, json={"title": "New name"}, headers=alice).json()
    assert renamed["title"] == "New name" and renamed["description"] == "old"  # only the title changed

    changed = client.patch(url, json={"description": "new text"}, headers=alice).json()
    assert changed["title"] == "New name" and changed["description"] == "new text"

    cleared = client.patch(url, json={"description": ""}, headers=alice).json()
    assert cleared["description"] == ""


def test_renaming_to_another_projects_name_is_rejected(client, alice):
    make_project(client, alice, "Alpha")
    beta = make_project(client, alice, "Beta")
    response = client.patch(f"/projects/{beta['project_id']}", json={"title": "alpha"}, headers=alice)
    assert response.status_code == 409


def test_changing_only_the_capitals_of_its_own_name_is_fine(client, alice):
    project = make_project(client, alice, "thesis")
    response = client.patch(f"/projects/{project['project_id']}", json={"title": "Thesis"}, headers=alice)
    assert response.status_code == 200 and response.json()["title"] == "Thesis"


def test_a_project_cannot_be_renamed_to_nothing(client, alice):
    project = make_project(client, alice, "Alpha")
    url = f"/projects/{project['project_id']}"
    assert client.patch(url, json={"title": " "}, headers=alice).status_code == 422
    assert client.patch(url, json={"title": None}, headers=alice).status_code == 422
    assert client.get(url, headers=alice).json()["title"] == "Alpha"


# ---------- ownership (BR-14) ----------


def test_another_user_cannot_see_change_or_delete_my_project(client, alice, bob):
    project = make_project(client, alice, "Secret plan", "private")
    url = f"/projects/{project['project_id']}"

    assert client.get(url, headers=bob).status_code == 404
    assert client.patch(url, json={"title": "Hacked"}, headers=bob).status_code == 404
    assert client.delete(url, headers=bob).status_code == 404
    assert client.get(f"{url}/progress", headers=bob).status_code == 404
    assert client.get("/projects", headers=bob).json() == []

    still_there = client.get(url, headers=alice).json()
    assert still_there["title"] == "Secret plan"


def test_a_missing_project_is_a_404_like_someone_elses(client, alice):
    assert client.get("/projects/999999", headers=alice).status_code == 404


# ---------- delete (BR-13) ----------


def test_deleting_a_project_deletes_its_tasks_notes_and_chats(client, alice, db_session):
    doomed = make_project(client, alice, "Doomed")
    kept = make_project(client, alice, "Kept")
    make_task(client, alice, doomed["project_id"])
    make_note(client, alice, doomed["project_id"])
    make_task(client, alice, kept["project_id"])
    doomed_chat = client.post(f"/projects/{doomed['project_id']}/chats", headers=alice).json()
    personal = client.post("/chats", headers=alice).json()
    db_session.add(Message(chat_id=doomed_chat["chat_id"], sender="user", text="hello"))
    db_session.commit()

    response = client.delete(f"/projects/{doomed['project_id']}", headers=alice)
    assert response.status_code == 204

    db_session.expire_all()
    assert client.get(f"/projects/{doomed['project_id']}", headers=alice).status_code == 404
    assert db_session.scalar(select(Task).where(Task.project_id == doomed["project_id"])) is None
    assert db_session.scalar(select(ProjectNote).where(ProjectNote.project_id == doomed["project_id"])) is None
    assert db_session.get(Chat, doomed_chat["chat_id"]) is None
    assert db_session.scalar(select(Message).where(Message.chat_id == doomed_chat["chat_id"])) is None

    # nothing else was touched
    assert db_session.get(Project, kept["project_id"]) is not None
    assert db_session.scalar(select(Task).where(Task.project_id == kept["project_id"])) is not None
    assert db_session.get(Chat, personal["chat_id"]) is not None


def test_a_deleted_name_can_be_used_again(client, alice):
    project = make_project(client, alice, "Reusable")
    client.delete(f"/projects/{project['project_id']}", headers=alice)
    assert client.post("/projects", json={"title": "Reusable"}, headers=alice).status_code == 201
