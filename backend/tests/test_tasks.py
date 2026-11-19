"""The task board: add, edit, move between To Do / In Progress / Done, due dates, progress (FR-12, UC-6)."""

import pytest

from tests.chat_helpers import chat_settings, register_user
from tests.project_helpers import make_project, make_task, move_task

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
    return make_project(client, alice, "Board")


# ---------- add ----------


def test_a_new_task_starts_in_to_do(client, alice, project):
    task = make_task(client, alice, project["project_id"], "  Write chapter 1 ", "Intro and aims", "2026-12-15")
    assert task["title"] == "Write chapter 1"
    assert task["description"] == "Intro and aims"
    assert task["status"] == "todo"
    assert task["due_date"] == "2026-12-15"
    assert task["project_id"] == project["project_id"]


def test_description_and_due_date_are_optional(client, alice, project):
    task = make_task(client, alice, project["project_id"], "Just a title")
    assert task["description"] == "" and task["due_date"] is None


@pytest.mark.parametrize("title", ["", "   "])
def test_a_task_without_a_title_is_rejected(client, alice, project, title):
    response = client.post(f"/projects/{project['project_id']}/tasks", json={"title": title}, headers=alice)
    assert response.status_code == 422


def test_a_bad_due_date_is_rejected(client, alice, project):
    response = client.post(
        f"/projects/{project['project_id']}/tasks", json={"title": "x", "due_date": "next week"}, headers=alice
    )
    assert response.status_code == 422


def test_tasks_are_listed_in_the_order_they_were_added(client, alice, project):
    pid = project["project_id"]
    for title in ("one", "two", "three"):
        make_task(client, alice, pid, title)
    listed = client.get(f"/projects/{pid}/tasks", headers=alice).json()
    assert [t["title"] for t in listed] == ["one", "two", "three"]


# ---------- move (BR-16) ----------


def test_a_task_moves_through_all_three_columns_and_back(client, alice, project):
    pid = project["project_id"]
    task = make_task(client, alice, pid, "Move me")
    for status in ("in_progress", "done", "todo", "done"):
        assert move_task(client, alice, pid, task["task_id"], status)["status"] == status

    saved = client.get(f"/projects/{pid}/tasks", headers=alice).json()[0]
    assert saved["status"] == "done"


def test_an_unknown_status_is_rejected_and_the_task_is_unchanged(client, alice, project):
    pid = project["project_id"]
    task = make_task(client, alice, pid)
    url = f"/projects/{pid}/tasks/{task['task_id']}"
    assert client.patch(url, json={"status": "finished"}, headers=alice).status_code == 422
    assert client.patch(url, json={"status": None}, headers=alice).status_code == 422
    assert client.get(f"/projects/{pid}/tasks", headers=alice).json()[0]["status"] == "todo"


def test_list_only_one_column(client, alice, project):
    pid = project["project_id"]
    a, b = make_task(client, alice, pid, "a"), make_task(client, alice, pid, "b")
    make_task(client, alice, pid, "c")
    move_task(client, alice, pid, a["task_id"], "done")
    move_task(client, alice, pid, b["task_id"], "in_progress")

    def titles(status):
        return [t["title"] for t in client.get(f"/projects/{pid}/tasks?status={status}", headers=alice).json()]

    assert titles("todo") == ["c"]
    assert titles("in_progress") == ["b"]
    assert titles("done") == ["a"]
    assert client.get(f"/projects/{pid}/tasks?status=nope", headers=alice).status_code == 422


# ---------- edit ----------


def test_edit_title_and_description_without_touching_the_rest(client, alice, project):
    pid = project["project_id"]
    task = make_task(client, alice, pid, "Old", "old text", "2026-12-01")
    url = f"/projects/{pid}/tasks/{task['task_id']}"

    edited = client.patch(url, json={"title": "New", "description": "new text"}, headers=alice).json()
    assert (edited["title"], edited["description"]) == ("New", "new text")
    assert edited["due_date"] == "2026-12-01" and edited["status"] == "todo"


def test_a_due_date_can_be_set_changed_and_removed(client, alice, project):
    pid = project["project_id"]
    task = make_task(client, alice, pid)
    url = f"/projects/{pid}/tasks/{task['task_id']}"

    assert client.patch(url, json={"due_date": "2027-01-10"}, headers=alice).json()["due_date"] == "2027-01-10"
    assert client.patch(url, json={"due_date": "2027-02-01"}, headers=alice).json()["due_date"] == "2027-02-01"
    assert client.patch(url, json={"due_date": None}, headers=alice).json()["due_date"] is None


def test_a_task_cannot_lose_its_title(client, alice, project):
    pid = project["project_id"]
    task = make_task(client, alice, pid, "Keep")
    url = f"/projects/{pid}/tasks/{task['task_id']}"
    assert client.patch(url, json={"title": ""}, headers=alice).status_code == 422
    assert client.patch(url, json={"title": None}, headers=alice).status_code == 422


def test_delete_a_task(client, alice, project):
    pid = project["project_id"]
    task = make_task(client, alice, pid)
    assert client.delete(f"/projects/{pid}/tasks/{task['task_id']}", headers=alice).status_code == 204
    assert client.get(f"/projects/{pid}/tasks", headers=alice).json() == []
    assert client.delete(f"/projects/{pid}/tasks/{task['task_id']}", headers=alice).status_code == 404


# ---------- progress ----------


def test_progress_counts_per_status_and_percent_done(client, alice, project):
    pid = project["project_id"]
    empty = client.get(f"/projects/{pid}/progress", headers=alice).json()
    assert empty == {"total": 0, "todo": 0, "in_progress": 0, "done": 0, "percent_done": 0}

    tasks = [make_task(client, alice, pid, f"t{n}") for n in range(4)]
    move_task(client, alice, pid, tasks[0]["task_id"], "done")
    move_task(client, alice, pid, tasks[1]["task_id"], "done")
    move_task(client, alice, pid, tasks[2]["task_id"], "in_progress")

    progress = client.get(f"/projects/{pid}/progress", headers=alice).json()
    assert progress == {"total": 4, "todo": 1, "in_progress": 1, "done": 2, "percent_done": 50}

    # the same numbers are inside the project itself and in the project list
    assert client.get(f"/projects/{pid}", headers=alice).json()["progress"] == progress
    assert client.get("/projects", headers=alice).json()[0]["progress"] == progress


def test_percent_is_rounded(client, alice, project):
    pid = project["project_id"]
    tasks = [make_task(client, alice, pid) for _ in range(3)]
    move_task(client, alice, pid, tasks[0]["task_id"], "done")
    assert client.get(f"/projects/{pid}/progress", headers=alice).json()["percent_done"] == 33


def test_progress_of_one_project_does_not_count_another_projects_tasks(client, alice):
    one, two = make_project(client, alice, "One"), make_project(client, alice, "Two")
    task = make_task(client, alice, one["project_id"])
    move_task(client, alice, one["project_id"], task["task_id"], "done")
    assert client.get(f"/projects/{two['project_id']}/progress", headers=alice).json()["total"] == 0


# ---------- ownership (BR-14, BR-15) ----------


def test_another_user_cannot_read_or_change_my_tasks(client, alice, bob, project):
    pid = project["project_id"]
    task = make_task(client, alice, pid, "Mine")
    url = f"/projects/{pid}/tasks"

    assert client.get(url, headers=bob).status_code == 404
    assert client.post(url, json={"title": "Sneaky"}, headers=bob).status_code == 404
    assert client.patch(f"{url}/{task['task_id']}", json={"status": "done"}, headers=bob).status_code == 404
    assert client.delete(f"{url}/{task['task_id']}", headers=bob).status_code == 404

    untouched = client.get(url, headers=alice).json()
    assert [(t["title"], t["status"]) for t in untouched] == [("Mine", "todo")]


def test_a_task_is_only_reachable_through_its_own_project(client, alice, bob, project):
    """Bob has a project of his own, but that does not let him reach Alice's task by its number."""
    task = make_task(client, alice, project["project_id"], "Alice's task")
    bobs = make_project(client, bob, "Bob's project")
    url = f"/projects/{bobs['project_id']}/tasks/{task['task_id']}"
    assert client.patch(url, json={"status": "done"}, headers=bob).status_code == 404
    assert client.delete(url, headers=bob).status_code == 404
    # and the same for Alice herself: a task of another of her projects is not in this one
    other = make_project(client, alice, "Other")
    assert (
        client.patch(f"/projects/{other['project_id']}/tasks/{task['task_id']}", json={"status": "done"}, headers=alice).status_code
        == 404
    )
