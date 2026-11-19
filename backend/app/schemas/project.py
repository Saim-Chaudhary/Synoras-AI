"""The shape of the data going in and out of the /projects endpoints (SRS FR-11, FR-12)."""

from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, StringConstraints, model_validator

# Same limits as the columns. Spaces around a title are removed; an empty title is rejected.
Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)]
ProjectDescription = Annotated[str, StringConstraints(strip_whitespace=True, max_length=2000)]
TaskDescription = Annotated[str, StringConstraints(strip_whitespace=True, max_length=2000)]
NoteContent = Annotated[str, StringConstraints(strip_whitespace=True, max_length=10000)]

TaskStatus = Literal["todo", "in_progress", "done"]
NoteKind = Literal["summary", "decision"]


class _PartialUpdate(BaseModel):
    """Base of the "change some fields" bodies. A field that is left out is not changed.
    Fields that cannot be empty (a title) also reject an explicit null."""

    _not_nullable: tuple[str, ...] = ()

    @model_validator(mode="after")
    def _reject_null(self):
        for name in self._not_nullable:
            if name in self.model_fields_set and getattr(self, name) is None:
                raise ValueError(f"{name} cannot be empty")
        return self


# ---------- progress ----------


class ProgressOut(BaseModel):
    """How far a project is: the tasks counted per status, and the share that is done (0 to 100)."""

    total: int
    todo: int
    in_progress: int
    done: int
    percent_done: int


# ---------- projects ----------


class ProjectCreate(BaseModel):
    title: Title
    description: ProjectDescription = ""


class ProjectUpdate(_PartialUpdate):
    _not_nullable = ("title", "description")

    title: Title | None = None
    description: ProjectDescription | None = None


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_id: int
    title: str
    description: str
    created_at: datetime
    progress: ProgressOut
    chat_count: int


# ---------- tasks ----------


class TaskCreate(BaseModel):
    title: Title
    description: TaskDescription = ""
    due_date: date | None = None  # a new task always starts in To Do


class TaskUpdate(_PartialUpdate):
    """Edit a task, or move it: send `status`. `due_date: null` removes the due date."""

    _not_nullable = ("title", "description", "status")

    title: Title | None = None
    description: TaskDescription | None = None
    status: TaskStatus | None = None
    due_date: date | None = None


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    task_id: int
    project_id: int
    title: str
    description: str
    status: TaskStatus
    due_date: date | None
    created_at: datetime


# ---------- notes ----------


class NoteCreate(BaseModel):
    kind: NoteKind
    title: Title
    content: NoteContent = ""


class NoteUpdate(_PartialUpdate):
    _not_nullable = ("kind", "title", "content")

    kind: NoteKind | None = None
    title: Title | None = None
    content: NoteContent | None = None


class NoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    note_id: int
    project_id: int
    kind: NoteKind
    title: str
    content: str
    created_at: datetime
