"use client";

// The Projects part of the sidebar: my projects, a "+" to create one, and a link to all of them
// (UC-5). It looks and behaves like the chat list: the open project has the amber marker.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ChevronDownIcon, ChevronRightIcon, FolderIcon, PlusIcon } from "@/components/icons";
import { useProjects } from "@/components/projects/projects-provider";

export default function ProjectsSection({ onNavigate }: { onNavigate?: () => void }) {
  const { projects, status, errorMessage, refresh } = useProjects();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  return (
    <section className="mt-4" aria-label="Projects">
      <div className="flex items-center">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="flex min-h-10 flex-1 items-center gap-1 rounded-control px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-faint hover:bg-surface-hover"
        >
          {open ? <ChevronDownIcon className="size-4" /> : <ChevronRightIcon className="size-4" />}
          Projects
        </button>
        <Link
          href="/projects/new"
          onClick={onNavigate}
          aria-label="New project"
          title="New project"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-control text-ink-muted hover:bg-surface-hover hover:text-ink"
        >
          <PlusIcon className="size-4" />
        </Link>
      </div>

      {open && (
        <div>
          {status === "loading" && <p className="px-3 py-2 text-sm text-ink-muted">Loading projects...</p>}

          {status === "error" && (
            <div className="px-3 py-2 text-sm">
              <p role="alert" className="text-danger">
                {errorMessage}
              </p>
              <button type="button" onClick={() => void refresh()} className="mt-1 min-h-10 text-ink underline">
                Try again
              </button>
            </div>
          )}

          {status === "ready" && projects.length === 0 && (
            <p className="px-3 py-2 text-sm text-ink-muted">
              No projects yet.{" "}
              <Link href="/projects/new" onClick={onNavigate} className="text-ink underline">
                Create one
              </Link>
            </p>
          )}

          {status === "ready" && projects.length > 0 && (
            <ul className="space-y-0.5">
              {projects.map((project) => {
                const href = `/projects/${project.project_id}`;
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <li key={project.project_id} className={`relative rounded-control ${active ? "bg-live-soft" : "hover:bg-surface-hover"}`}>
                    {active && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-live" />}
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className="flex min-h-10 items-center gap-2 py-2 pl-4 pr-2 text-sm text-ink"
                    >
                      <FolderIcon className="size-4 shrink-0 text-ink-muted" />
                      <span className="truncate">{project.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <Link
            href="/projects"
            onClick={onNavigate}
            className="mt-1 flex min-h-10 items-center px-4 text-sm text-ink-muted hover:text-ink"
          >
            All projects
          </Link>
        </div>
      )}
    </section>
  );
}
