// The project API: one function per backend endpoint (see backend/app/api/projects.py).
// Every call needs a login, so they all go through authFetch.

import { authFetch } from "@/lib/auth";
import type { ChatSummary } from "@/lib/chats";

export type Progress = {
  total: number;
  todo: number;
  in_progress: number;
  done: number;
  percent_done: number;
};

export type Project = {
  project_id: number;
  title: string;
  description: string;
  created_at: string;
  progress: Progress;
  chat_count: number;
};

export type TaskStatus = "todo" | "in_progress" | "done";

export type Task = {
  task_id: number;
  project_id: number;
  title: string;
  description: string;
  status: TaskStatus;
  due_date: string | null; // "2026-12-15"
  created_at: string;
};

export type NoteKind = "summary" | "decision";

export type Note = {
  note_id: number;
  project_id: number;
  kind: NoteKind;
  title: string;
  content: string;
  created_at: string;
};

// ---------- projects ----------

export const listProjects = () => authFetch<Project[]>("/projects");

export const getProject = (projectId: number) => authFetch<Project>(`/projects/${projectId}`);

export const createProject = (title: string, description: string) =>
  authFetch<Project>("/projects", { method: "POST", body: { title, description } });

export const updateProject = (projectId: number, changes: { title?: string; description?: string }) =>
  authFetch<Project>(`/projects/${projectId}`, { method: "PATCH", body: changes });

export const deleteProject = (projectId: number) =>
  authFetch<void>(`/projects/${projectId}`, { method: "DELETE" });

// ---------- tasks ----------

export const listTasks = (projectId: number) => authFetch<Task[]>(`/projects/${projectId}/tasks`);

export const createTask = (projectId: number, task: { title: string; description: string; due_date: string | null }) =>
  authFetch<Task>(`/projects/${projectId}/tasks`, { method: "POST", body: task });

// Edit a task or move it (send status). A field that is left out is not changed; due_date null removes the date.
export const updateTask = (
  projectId: number,
  taskId: number,
  changes: { title?: string; description?: string; due_date?: string | null; status?: TaskStatus },
) => authFetch<Task>(`/projects/${projectId}/tasks/${taskId}`, { method: "PATCH", body: changes });

export const deleteTask = (projectId: number, taskId: number) =>
  authFetch<void>(`/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" });

// ---------- notes ----------

export const listNotes = (projectId: number) => authFetch<Note[]>(`/projects/${projectId}/notes`);

export const createNote = (projectId: number, note: { kind: NoteKind; title: string; content: string }) =>
  authFetch<Note>(`/projects/${projectId}/notes`, { method: "POST", body: note });

export const updateNote = (
  projectId: number,
  noteId: number,
  changes: { kind?: NoteKind; title?: string; content?: string },
) => authFetch<Note>(`/projects/${projectId}/notes/${noteId}`, { method: "PATCH", body: changes });

export const deleteNote = (projectId: number, noteId: number) =>
  authFetch<void>(`/projects/${projectId}/notes/${noteId}`, { method: "DELETE" });

// ---------- chats inside a project ----------

export const listProjectChats = (projectId: number) => authFetch<ChatSummary[]>(`/projects/${projectId}/chats`);

export const createProjectChat = (projectId: number) =>
  authFetch<ChatSummary>(`/projects/${projectId}/chats`, { method: "POST" });

// ---------- small helpers for the screens ----------

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

export const NOTE_KIND_LABELS: Record<NoteKind, string> = {
  summary: "Summary",
  decision: "Decision",
};

// "2026-12-15" -> "15 Dec 2026". The date has no time of day, so it is built from its parts
// (parsing it as a Date would shift it by the time zone).
export function formatDueDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// A task is overdue when its due date is before today and it is not done.
export function isOverdue(task: Pick<Task, "due_date" | "status">, today: Date = new Date()): boolean {
  if (!task.due_date || task.status === "done") return false;
  const [year, month, day] = task.due_date.split("-").map(Number);
  const due = new Date(year, month - 1, day).getTime();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return due < start;
}
