"""/projects: projects, their tasks, notes and chats (SRS FR-11, FR-12, FR-13; UC-5, UC-6).

Every endpoint needs a login (get_current_user) and only sees the user's own projects (BR-14).
Tasks, notes and chats are reached through their project, so the same check protects them.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.project import Project
from app.models.user import User
from app.schemas.chat import ChatOut
from app.schemas.project import (
    NoteCreate,
    NoteOut,
    NoteUpdate,
    ProgressOut,
    ProjectCreate,
    ProjectOut,
    ProjectUpdate,
    TaskCreate,
    TaskOut,
    TaskStatus,
    TaskUpdate,
)
from app.services import project_service
from app.services.project_service import ProjectError

router = APIRouter(prefix="/projects", tags=["projects"])

STATUS_FOR_KIND = {"not_found": 404, "duplicate_name": 409}


def http_error(error: ProjectError) -> HTTPException:
    return HTTPException(status_code=STATUS_FOR_KIND[error.kind], detail=error.message)


def get_project(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Project:
    """The project in the address, if it is the logged-in user's (otherwise a 404)."""
    try:
        return project_service.own_project(db, user.user_id, project_id)
    except ProjectError as error:
        raise http_error(error) from None


def project_out(db: Session, project: Project) -> ProjectOut:
    return projects_out(db, [project])[0]


def projects_out(db: Session, projects: list[Project]) -> list[ProjectOut]:
    ids = [project.project_id for project in projects]
    progress = project_service.progress_for(db, ids)
    chats = project_service.chat_counts(db, ids)
    return [
        ProjectOut(
            project_id=project.project_id,
            title=project.title,
            description=project.description,
            created_at=project.created_at,
            progress=progress[project.project_id],
            chat_count=chats[project.project_id],
        )
        for project in projects
    ]


# ---------- projects ----------


@router.post("", response_model=ProjectOut, status_code=201)
def create_project(body: ProjectCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a project. An empty or already used name is rejected."""
    try:
        project = project_service.create_project(db, user.user_id, body.title, body.description)
    except ProjectError as error:
        raise http_error(error) from None
    return project_out(db, project)


@router.get("", response_model=list[ProjectOut])
def list_projects(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """My projects, newest first, each with its progress."""
    return projects_out(db, project_service.list_projects(db, user.user_id))


@router.get("/{project_id}", response_model=ProjectOut)
def open_project(project: Project = Depends(get_project), db: Session = Depends(get_db)):
    return project_out(db, project)


@router.patch("/{project_id}", response_model=ProjectOut)
def edit_project(
    project_id: int,
    body: ProjectUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Rename a project or change its description. Only the fields you send are changed."""
    changes = body.model_dump(exclude_unset=True)
    try:
        project = project_service.update_project(db, user.user_id, project_id, changes)
    except ProjectError as error:
        raise http_error(error) from None
    return project_out(db, project)


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a project with its tasks, notes and chats (BR-13). The screen asks first."""
    try:
        project_service.delete_project(db, user.user_id, project_id)
    except ProjectError as error:
        raise http_error(error) from None
    return Response(status_code=204)


@router.get("/{project_id}/progress", response_model=ProgressOut)
def project_progress(project: Project = Depends(get_project), db: Session = Depends(get_db)):
    """Tasks counted per status, and the percentage that is done."""
    return project_service.progress_for(db, [project.project_id])[project.project_id]


# ---------- tasks ----------


@router.post("/{project_id}/tasks", response_model=TaskOut, status_code=201)
def create_task(body: TaskCreate, project: Project = Depends(get_project), db: Session = Depends(get_db)):
    """Add a task. It starts in To Do. A task without a title is rejected."""
    return project_service.create_task(db, project, body.title, body.description, body.due_date)


@router.get("/{project_id}/tasks", response_model=list[TaskOut])
def list_tasks(
    status: TaskStatus | None = Query(default=None, description="Only the tasks in this column"),
    project: Project = Depends(get_project),
    db: Session = Depends(get_db),
):
    return project_service.list_tasks(db, project, status)


@router.patch("/{project_id}/tasks/{task_id}", response_model=TaskOut)
def edit_task(
    task_id: int,
    body: TaskUpdate,
    project: Project = Depends(get_project),
    db: Session = Depends(get_db),
):
    """Edit a task or move it to another column (send `status`). Only the fields you send change."""
    try:
        return project_service.update_task(db, project, task_id, body.model_dump(exclude_unset=True))
    except ProjectError as error:
        raise http_error(error) from None


@router.delete("/{project_id}/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, project: Project = Depends(get_project), db: Session = Depends(get_db)):
    try:
        project_service.delete_task(db, project, task_id)
    except ProjectError as error:
        raise http_error(error) from None
    return Response(status_code=204)


# ---------- notes ----------


@router.post("/{project_id}/notes", response_model=NoteOut, status_code=201)
def create_note(body: NoteCreate, project: Project = Depends(get_project), db: Session = Depends(get_db)):
    """Write a summary or a decision for the project."""
    return project_service.create_note(db, project, body.kind, body.title, body.content)


@router.get("/{project_id}/notes", response_model=list[NoteOut])
def list_notes(project: Project = Depends(get_project), db: Session = Depends(get_db)):
    """The project's notes, newest first."""
    return project_service.list_notes(db, project)


@router.patch("/{project_id}/notes/{note_id}", response_model=NoteOut)
def edit_note(
    note_id: int,
    body: NoteUpdate,
    project: Project = Depends(get_project),
    db: Session = Depends(get_db),
):
    try:
        return project_service.update_note(db, project, note_id, body.model_dump(exclude_unset=True))
    except ProjectError as error:
        raise http_error(error) from None


@router.delete("/{project_id}/notes/{note_id}", status_code=204)
def delete_note(note_id: int, project: Project = Depends(get_project), db: Session = Depends(get_db)):
    try:
        project_service.delete_note(db, project, note_id)
    except ProjectError as error:
        raise http_error(error) from None
    return Response(status_code=204)


# ---------- chats inside a project ----------


@router.post("/{project_id}/chats", response_model=ChatOut, status_code=201)
def create_project_chat(
    project: Project = Depends(get_project),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Start a new, empty chat inside the project. Messages are sent with POST /chats/{id}/messages
    as usual; the project's name and description are given to the model as context (FR-13)."""
    return project_service.create_project_chat(db, user.user_id, project)


@router.get("/{project_id}/chats", response_model=list[ChatOut])
def list_project_chats(
    project: Project = Depends(get_project),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """The project's chats, the most recently active first."""
    return project_service.list_project_chats(db, user.user_id, project)
