"""Project notes: summaries and decisions written by the user (FR-11)."""

import pytest

from tests.chat_helpers import chat_settings, register_user
from tests.project_helpers import make_note, make_project

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


@pytest.fixture
def project(client, alice):
    return make_project(client, alice, "Notes project")


def test_create_and_list_notes_newest_first(client, alice, project):
    pid = project["project_id"]
    make_note(client, alice, pid, "decision", "Use PostgreSQL", "One database for everything")
    make_note(client, alice, pid, "summary", "Week 1", "Set up the project")

    notes = client.get(f"/projects/{pid}/notes", headers=alice).json()
    assert [(n["kind"], n["title"]) for n in notes] == [("summary", "Week 1"), ("decision", "Use PostgreSQL")]
    assert notes[1]["content"] == "One database for everything"
    assert notes[0]["project_id"] == pid


def test_a_note_needs_a_title_and_a_known_kind(client, alice, project):
    url = f"/projects/{project['project_id']}/notes"
    assert client.post(url, json={"kind": "decision", "title": " "}, headers=alice).status_code == 422
    assert client.post(url, json={"kind": "idea", "title": "x"}, headers=alice).status_code == 422
    assert client.post(url, json={"title": "no kind"}, headers=alice).status_code == 422
    assert client.get(url, headers=alice).json() == []


def test_the_text_of_a_note_is_optional(client, alice, project):
    note = client.post(
        f"/projects/{project['project_id']}/notes", json={"kind": "summary", "title": "Empty"}, headers=alice
    ).json()
    assert note["content"] == ""


def test_edit_a_note(client, alice, project):
    pid = project["project_id"]
    note = make_note(client, alice, pid, "summary", "Draft", "first")
    url = f"/projects/{pid}/notes/{note['note_id']}"

    edited = client.patch(url, json={"title": "Final", "content": "second", "kind": "decision"}, headers=alice).json()
    assert (edited["title"], edited["content"], edited["kind"]) == ("Final", "second", "decision")

    only_text = client.patch(url, json={"content": "third"}, headers=alice).json()
    assert (only_text["title"], only_text["kind"]) == ("Final", "decision")

    assert client.patch(url, json={"title": ""}, headers=alice).status_code == 422
    assert client.patch(url, json={"kind": "other"}, headers=alice).status_code == 422


def test_delete_a_note(client, alice, project):
    pid = project["project_id"]
    note = make_note(client, alice, pid)
    assert client.delete(f"/projects/{pid}/notes/{note['note_id']}", headers=alice).status_code == 204
    assert client.get(f"/projects/{pid}/notes", headers=alice).json() == []
    assert client.delete(f"/projects/{pid}/notes/{note['note_id']}", headers=alice).status_code == 404


def test_another_user_cannot_read_or_change_my_notes(client, alice, bob, project):
    pid = project["project_id"]
    note = make_note(client, alice, pid, "decision", "Private decision", "secret")
    url = f"/projects/{pid}/notes"

    assert client.get(url, headers=bob).status_code == 404
    assert client.post(url, json={"kind": "summary", "title": "x"}, headers=bob).status_code == 404
    assert client.patch(f"{url}/{note['note_id']}", json={"title": "Hacked"}, headers=bob).status_code == 404
    assert client.delete(f"{url}/{note['note_id']}", headers=bob).status_code == 404

    assert client.get(url, headers=alice).json()[0]["title"] == "Private decision"


def test_a_note_is_only_reachable_through_its_own_project(client, alice, bob, project):
    note = make_note(client, alice, project["project_id"])
    bobs = make_project(client, bob, "Bob's")
    url = f"/projects/{bobs['project_id']}/notes/{note['note_id']}"
    assert client.patch(url, json={"title": "x"}, headers=bob).status_code == 404
    assert client.delete(url, headers=bob).status_code == 404
