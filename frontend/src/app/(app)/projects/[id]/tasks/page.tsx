"use client";

// The Tasks tab: a three-column board, To Do / In Progress / Done (FR-12, UC-6, BR-16).
// A task is moved with buttons (they work with a keyboard and on a phone). The screen changes
// at once and goes back, with a message, if the server says no. On a phone the columns stack.

import { useCallback, useState } from "react";

import { buttonClass } from "@/components/button";
import ConfirmBox from "@/components/confirm-box";
import { NoTasksArt } from "@/components/illustrations/empty-states";
import { AlertIcon, ArrowLeftIcon, ArrowRightIcon, CalendarIcon, PencilIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { useProject } from "@/components/projects/project-context";
import TaskForm from "@/components/projects/task-form";
import { ApiError } from "@/lib/api";
import { useLoad } from "@/lib/use-load";
import {
  STATUS_LABELS,
  createTask,
  deleteTask,
  formatDueDate,
  isOverdue,
  listTasks,
  updateTask,
  type Task,
  type TaskStatus,
} from "@/lib/projects";

const COLUMNS: TaskStatus[] = ["todo", "in_progress", "done"];

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}

const SMALL_BUTTON =
  "inline-flex min-h-9 items-center gap-1.5 rounded-control px-2.5 text-sm text-ink-muted hover:bg-surface-hover hover:text-ink disabled:opacity-50";

export default function TasksPage() {
  const { project, refreshProject } = useProject();
  const projectId = project.project_id;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null); // a move or delete that failed
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setTasks(await listTasks(projectId));
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setLoadError(errorText(error));
    }
  }, [projectId]);

  // The page starts in "loading" and is created again for every project (see project-shell.tsx).
  useLoad(load);

  async function move(task: Task, to: TaskStatus) {
    setBanner(null);
    setTasks((list) => list.map((t) => (t.task_id === task.task_id ? { ...t, status: to } : t))); // at once
    try {
      await updateTask(projectId, task.task_id, { status: to });
      void refreshProject(); // the progress in the header
    } catch (error) {
      setTasks((list) => list.map((t) => (t.task_id === task.task_id ? { ...t, status: task.status } : t))); // back
      setBanner(`"${task.title}" was not moved: ${errorText(error)}`);
    }
  }

  async function confirmDelete(task: Task) {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteTask(projectId, task.task_id);
      setTasks((list) => list.filter((t) => t.task_id !== task.task_id));
      setDeletingId(null);
      void refreshProject();
    } catch (error) {
      setDeleteError(errorText(error));
    }
    setDeleteBusy(false);
  }

  if (status === "loading") {
    return (
      <p role="status" className="text-ink-muted">
        Loading tasks...
      </p>
    );
  }
  if (status === "error") {
    return (
      <div role="alert" className="max-w-md rounded-card border border-danger-line bg-danger-soft p-4">
        <p className="text-danger">{loadError}</p>
        <button type="button" onClick={() => void load()} className={buttonClass("secondary", "mt-3")}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="sr-only">Task board</h2>
      {banner && (
        <p role="alert" className="mb-4 flex items-start gap-2 rounded-control border border-danger-line bg-danger-soft px-3 py-2.5 text-sm text-danger">
          <AlertIcon className="mt-0.5 size-4 shrink-0" />
          {banner}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((column, index) => {
          const inColumn = tasks.filter((t) => t.status === column);
          const previous = COLUMNS[index - 1];
          const next = COLUMNS[index + 1];
          return (
            <section key={column} aria-labelledby={`column-${column}`} className="rounded-card border border-line bg-sidebar p-3">
              <h3 id={`column-${column}`} className="flex items-center justify-between px-1 pb-3 text-sm font-semibold text-ink">
                {STATUS_LABELS[column]}
                <span className="rounded-full border border-line px-2 py-0.5 text-xs font-normal text-ink-muted">
                  {inColumn.length}
                </span>
              </h3>

              <ul className="space-y-3">
                {inColumn.map((task) => (
                  <li key={task.task_id}>
                    {editingId === task.task_id ? (
                      <TaskForm
                        initialTitle={task.title}
                        initialDescription={task.description}
                        initialDueDate={task.due_date}
                        submitLabel="Save"
                        busyLabel="Saving..."
                        onCancel={() => setEditingId(null)}
                        onSubmit={async (values) => {
                          try {
                            const saved = await updateTask(projectId, task.task_id, values);
                            setTasks((list) => list.map((t) => (t.task_id === saved.task_id ? saved : t)));
                            setEditingId(null);
                            return null;
                          } catch (error) {
                            return errorText(error);
                          }
                        }}
                      />
                    ) : deletingId === task.task_id ? (
                      <ConfirmBox
                        title="Delete this task?"
                        busy={deleteBusy}
                        error={deleteError}
                        onConfirm={() => void confirmDelete(task)}
                        onCancel={() => setDeletingId(null)}
                      />
                    ) : (
                      <article className="rounded-card border border-line bg-raised p-3">
                        <h4 className="break-words font-medium text-ink">{task.title}</h4>
                        {task.description && (
                          <p className="mt-1 line-clamp-3 whitespace-pre-wrap break-words text-sm text-ink-muted">{task.description}</p>
                        )}
                        {task.due_date && (
                          <p
                            className={`mt-2 inline-flex items-center gap-1.5 text-xs ${
                              isOverdue(task) ? "font-medium text-danger" : "text-ink-muted"
                            }`}
                          >
                            {isOverdue(task) ? <AlertIcon className="size-3.5" /> : <CalendarIcon className="size-3.5" />}
                            {isOverdue(task) && "Overdue: "}
                            {formatDueDate(task.due_date)}
                          </p>
                        )}
                        <div className="-mx-1 mt-2 flex flex-wrap items-center gap-1">
                          {previous && (
                            <button
                              type="button"
                              aria-label={`Move "${task.title}" to ${STATUS_LABELS[previous]}`}
                              onClick={() => void move(task, previous)}
                              className={SMALL_BUTTON}
                            >
                              <ArrowLeftIcon className="size-4" />
                              {STATUS_LABELS[previous]}
                            </button>
                          )}
                          {next && (
                            <button
                              type="button"
                              aria-label={`Move "${task.title}" to ${STATUS_LABELS[next]}`}
                              onClick={() => void move(task, next)}
                              className={SMALL_BUTTON}
                            >
                              {STATUS_LABELS[next]}
                              <ArrowRightIcon className="size-4" />
                            </button>
                          )}
                          <span className="ml-auto flex">
                            <button
                              type="button"
                              aria-label={`Edit task "${task.title}"`}
                              title="Edit task"
                              onClick={() => {
                                setAdding(false);
                                setEditingId(task.task_id);
                              }}
                              className="inline-flex size-9 items-center justify-center rounded-control text-ink-muted hover:bg-surface-hover hover:text-ink"
                            >
                              <PencilIcon className="size-4" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Delete task "${task.title}"`}
                              title="Delete task"
                              onClick={() => {
                                setDeleteError(null);
                                setDeletingId(task.task_id);
                              }}
                              className="inline-flex size-9 items-center justify-center rounded-control text-ink-muted hover:bg-surface-hover hover:text-ink"
                            >
                              <TrashIcon className="size-4" />
                            </button>
                          </span>
                        </div>
                      </article>
                    )}
                  </li>
                ))}
              </ul>

              {inColumn.length === 0 && !(column === "todo" && adding) && (
                <div className="flex flex-col items-center px-1 py-2 text-center">
                  {column === "todo" && tasks.length === 0 && <NoTasksArt className="mb-2 h-24 w-auto" />}
                  <p className="text-sm text-ink-muted">
                    {column === "todo" && tasks.length === 0 ? "No tasks yet. Add the first one below." : "No tasks here."}
                  </p>
                </div>
              )}

              {column === "todo" && (
                <div className="mt-3">
                  {adding ? (
                    <TaskForm
                      submitLabel="Add task"
                      busyLabel="Adding..."
                      onCancel={() => setAdding(false)}
                      onSubmit={async (values) => {
                        try {
                          const created = await createTask(projectId, values);
                          setTasks((list) => [...list, created]);
                          setAdding(false);
                          void refreshProject();
                          return null;
                        } catch (error) {
                          return errorText(error);
                        }
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setAdding(true);
                      }}
                      className={buttonClass("quiet", "w-full !justify-start")}
                    >
                      <PlusIcon className="size-4" />
                      Add task
                    </button>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
