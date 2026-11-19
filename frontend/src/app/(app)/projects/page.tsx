"use client";

import Link from "next/link";
import { useEffect } from "react";

import { buttonClass } from "@/components/button";
import { FolderIcon, PlusIcon } from "@/components/icons";
import ProgressBar from "@/components/projects/progress-bar";
import { useProjects } from "@/components/projects/projects-provider";

// The page /projects: all my projects as cards (UC-5). It loads a fresh list every time it opens,
// so the progress shown is up to date after working on tasks.
export default function ProjectsPage() {
  const { projects, status, errorMessage, refresh } = useProjects();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Projects</h1>
          <p className="mt-1 text-ink-muted">Each project keeps its own chats, tasks and notes.</p>
        </div>
        <Link href="/projects/new" className={buttonClass("primary")}>
          <PlusIcon className="size-4" />
          New project
        </Link>
      </div>

      <div className="mt-8">
        {status === "loading" && (
          <p role="status" className="text-ink-muted">
            Loading projects...
          </p>
        )}

        {status === "error" && (
          <div role="alert" className="max-w-md rounded-card border border-danger-line bg-danger-soft p-4">
            <p className="text-danger">{errorMessage}</p>
            <button type="button" onClick={() => void refresh()} className={buttonClass("secondary", "mt-3")}>
              Try again
            </button>
          </div>
        )}

        {status === "ready" && projects.length === 0 && (
          <div className="flex flex-col items-center rounded-card border border-line-strong px-6 py-14 text-center">
            <FolderIcon className="size-8 text-ink-muted" />
            <h2 className="mt-4 text-lg font-semibold text-ink">No projects yet</h2>
            <p className="mt-1.5 max-w-sm text-ink-muted">
              Create a project for a piece of work, such as your thesis. You get a task board, notes, and chats that know
              what the project is about.
            </p>
            <Link href="/projects/new" className={buttonClass("primary", "mt-6")}>
              <PlusIcon className="size-4" />
              Create your first project
            </Link>
          </div>
        )}

        {status === "ready" && projects.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <li key={project.project_id}>
                <Link
                  href={`/projects/${project.project_id}`}
                  className="block h-full rounded-card border border-line-strong bg-surface p-4 hover:bg-surface-hover"
                >
                  <h2 className="truncate font-semibold text-ink">{project.title}</h2>
                  <p className="mt-1 line-clamp-2 min-h-10 text-sm text-ink-muted">
                    {project.description || "No description."}
                  </p>
                  <div className="mt-4">
                    <ProgressBar progress={project.progress} />
                  </div>
                  <p className="mt-2 text-xs text-ink-muted">
                    {project.chat_count} {project.chat_count === 1 ? "chat" : "chats"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
