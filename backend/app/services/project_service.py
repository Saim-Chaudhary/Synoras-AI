"""Projects, tasks and notes: the database work behind /projects (SRS FR-11 to FR-13; SDD 5.2).

Every function takes the user's id and only ever touches that user's own projects (BR-14).
A project that exists but belongs to somebody else is reported as "not found", exactly like a
project that does not exist, so nobody can find out which ids are in use. Tasks and notes are
always reached THROUGH their project, so they are protected by the same check (BR-15).

Deleting a project deletes its tasks, notes and chats (BR-13): the database does it
(ON DELETE CASCADE), so nothing can be left behind.
"""

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.chat import DEFAULT_TITLE, Chat
from app.models.project import Project, ProjectNote, Task
from app.schemas.project import ProgressOut

# How much of the project is sent to the model as context (FR-13). Only the name and the
# description for now; a long description is cut so it cannot use up a small free plan.
CONTEXT_DESCRIPTION_MAX_CHARS = 1000


class ProjectError(Exception):
    """kind is one of: not_found, duplicate_name."""

    def __init__(self, kind: str, message: str):
        super().__init__(message)
        self.kind = kind
        self.message = message


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ---------- projects ----------


def own_project(db: Session, user_id: int, project_id: int) -> Project:
    project = db.scalar(select(Project).where(Project.project_id == project_id, Project.user_id == user_id))
    if project is None:
        raise ProjectError("not_found", "Project not found")
    return project


def _name_is_taken(db: Session, user_id: int, title: str, ignore_project_id: int | None = None) -> bool:
    """True if the user already has a project with this name (capitals do not matter)."""
    statement = select(Project.project_id).where(
        Project.user_id == user_id, func.lower(Project.title) == title.lower()
    )
    if ignore_project_id is not None:
        statement = statement.where(Project.project_id != ignore_project_id)
    return db.scalar(statement.limit(1)) is not None


_DUPLICATE = "You already have a project with this name. Please use a different name."


def create_project(db: Session, user_id: int, title: str, description: str) -> Project:
    if _name_is_taken(db, user_id, title):
        raise ProjectError("duplicate_name", _DUPLICATE)
    project = Project(user_id=user_id, title=title, description=description)
    db.add(project)
    try:
        db.commit()
    except IntegrityError:  # two requests at once: the database index has the last word
        db.rollback()
        raise ProjectError("duplicate_name", _DUPLICATE) from None
    db.refresh(project)
    return project


def list_projects(db: Session, user_id: int) -> list[Project]:
    """The user's projects, newest first."""
    return list(
        db.scalars(
            select(Project)
            .where(Project.user_id == user_id)
            .order_by(Project.created_at.desc(), Project.project_id.desc())
        )
    )


def update_project(db: Session, user_id: int, project_id: int, changes: dict) -> Project:
    project = own_project(db, user_id, project_id)
    if "title" in changes and changes["title"].lower() != project.title.lower():
        if _name_is_taken(db, user_id, changes["title"], ignore_project_id=project.project_id):
            raise ProjectError("duplicate_name", _DUPLICATE)
    for field, value in changes.items():
        setattr(project, field, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ProjectError("duplicate_name", _DUPLICATE) from None
    db.refresh(project)
    return project


def delete_project(db: Session, user_id: int, project_id: int) -> None:
    project = own_project(db, user_id, project_id)
    db.delete(project)  # its tasks, notes and chats go with it (ON DELETE CASCADE)
    db.commit()


# ---------- progress and counts ----------


def _progress_from_counts(counts: dict[str, int]) -> ProgressOut:
    todo, in_progress, done = counts.get("todo", 0), counts.get("in_progress", 0), counts.get("done", 0)
    total = todo + in_progress + done
    percent = round(done * 100 / total) if total else 0
    return ProgressOut(total=total, todo=todo, in_progress=in_progress, done=done, percent_done=percent)


def progress_for(db: Session, project_ids: list[int]) -> dict[int, ProgressOut]:
    """The progress of several projects with one query."""
    counts: dict[int, dict[str, int]] = {project_id: {} for project_id in project_ids}
    if project_ids:
        rows = db.execute(
            select(Task.project_id, Task.status, func.count())
            .where(Task.project_id.in_(project_ids))
            .group_by(Task.project_id, Task.status)
        ).all()
        for project_id, status, count in rows:
            counts[project_id][status] = count
    return {project_id: _progress_from_counts(by_status) for project_id, by_status in counts.items()}


def chat_counts(db: Session, project_ids: list[int]) -> dict[int, int]:
    counts = {project_id: 0 for project_id in project_ids}
    if project_ids:
        rows = db.execute(
            select(Chat.project_id, func.count()).where(Chat.project_id.in_(project_ids)).group_by(Chat.project_id)
        ).all()
        for project_id, count in rows:
            counts[project_id] = count
    return counts


# ---------- tasks ----------


def own_task(db: Session, project: Project, task_id: int) -> Task:
    task = db.scalar(select(Task).where(Task.task_id == task_id, Task.project_id == project.project_id))
    if task is None:
        raise ProjectError("not_found", "Task not found")
    return task


def create_task(db: Session, project: Project, title: str, description: str, due_date) -> Task:
    task = Task(project_id=project.project_id, title=title, description=description, due_date=due_date, status="todo")
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def list_tasks(db: Session, project: Project, status: str | None = None) -> list[Task]:
    """The project's tasks in the order they were added, optionally only one column."""
    statement = select(Task).where(Task.project_id == project.project_id)
    if status:
        statement = statement.where(Task.status == status)
    return list(db.scalars(statement.order_by(Task.created_at, Task.task_id)))


def update_task(db: Session, project: Project, task_id: int, changes: dict) -> Task:
    task = own_task(db, project, task_id)
    for field, value in changes.items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, project: Project, task_id: int) -> None:
    db.delete(own_task(db, project, task_id))
    db.commit()


# ---------- notes ----------


def own_note(db: Session, project: Project, note_id: int) -> ProjectNote:
    note = db.scalar(
        select(ProjectNote).where(ProjectNote.note_id == note_id, ProjectNote.project_id == project.project_id)
    )
    if note is None:
        raise ProjectError("not_found", "Note not found")
    return note


def create_note(db: Session, project: Project, kind: str, title: str, content: str) -> ProjectNote:
    note = ProjectNote(project_id=project.project_id, kind=kind, title=title, content=content)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def list_notes(db: Session, project: Project) -> list[ProjectNote]:
    """Newest first."""
    return list(
        db.scalars(
            select(ProjectNote)
            .where(ProjectNote.project_id == project.project_id)
            .order_by(ProjectNote.created_at.desc(), ProjectNote.note_id.desc())
        )
    )


def update_note(db: Session, project: Project, note_id: int, changes: dict) -> ProjectNote:
    note = own_note(db, project, note_id)
    for field, value in changes.items():
        setattr(note, field, value)
    db.commit()
    db.refresh(note)
    return note


def delete_note(db: Session, project: Project, note_id: int) -> None:
    db.delete(own_note(db, project, note_id))
    db.commit()


# ---------- chats inside a project ----------


def create_project_chat(db: Session, user_id: int, project: Project) -> Chat:
    chat = Chat(
        user_id=user_id,
        project_id=project.project_id,
        title=DEFAULT_TITLE,
        created_at=_now(),
        updated_at=_now(),
    )
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return chat


def list_project_chats(db: Session, user_id: int, project: Project) -> list[Chat]:
    """The project's chats, the most recently active first."""
    return list(
        db.scalars(
            select(Chat)
            .where(Chat.user_id == user_id, Chat.project_id == project.project_id)
            .order_by(Chat.updated_at.desc(), Chat.chat_id.desc())
        )
    )


def project_context_text(project: Project) -> str:
    """What the model is told about the project in a project chat (FR-13)."""
    text = f'This conversation belongs to the user\'s project "{project.title}".'
    description = (project.description or "").strip()
    if description:
        text += f" Project description: {description[:CONTEXT_DESCRIPTION_MAX_CHARS]}"
    text += " Keep your answers relevant to this project when it makes sense."
    return text
