"""Small helpers shared by the project tests: make a project, a task, a note."""


def make_project(client, headers, title="My project", description=""):
    response = client.post("/projects", json={"title": title, "description": description}, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def make_task(client, headers, project_id, title="A task", description="", due_date=None):
    response = client.post(
        f"/projects/{project_id}/tasks",
        json={"title": title, "description": description, "due_date": due_date},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def move_task(client, headers, project_id, task_id, status):
    response = client.patch(f"/projects/{project_id}/tasks/{task_id}", json={"status": status}, headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


def make_note(client, headers, project_id, kind="decision", title="A note", content="Some text"):
    response = client.post(
        f"/projects/{project_id}/notes", json={"kind": kind, "title": title, "content": content}, headers=headers
    )
    assert response.status_code == 201, response.text
    return response.json()
