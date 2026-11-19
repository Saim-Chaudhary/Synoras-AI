"use client";

// The frame of one project: its name, description, progress, Edit and Delete, and the tabs
// Chats, Tasks, Notes and Documents (FR-11, UC-5). The tab pages are drawn inside it.
// Each tab is a real link (/projects/12, /projects/12/tasks, ...), so the Back button works.

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useState, type ReactNode } from "react";

import { buttonClass } from "@/components/button";
import ConfirmBox from "@/components/confirm-box";
import { ArrowLeftIcon, PencilIcon, TrashIcon } from "@/components/icons";
import { ApiError } from "@/lib/api";
import { useLoad } from "@/lib/use-load";
import { getProject, type Project } from "@/lib/projects";

import { ProjectContext } from "./project-context";
import ProgressBar from "./progress-bar";
import ProjectForm from "./project-form";
import { useProjects } from "./projects-provider";

const TAB_CLASS = "inline-flex min-h-11 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-medium";

// The outer part only reads the number from the address. The inner part is created again (key)
// for every project, so opening another project starts from a clean, "loading" state.
export default function ProjectShell({ children }: { children: ReactNode }) {
  const params = useParams<{ id: string }>();
  return (
    <OpenProject key={params.id} projectId={Number(params.id)}>
      {children}
    </OpenProject>
  );
}

function OpenProject({ projectId, children }: { projectId: number; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { updateProject, deleteProject, replaceProject } = useProjects();

  const [project, setProject] = useState<Project | null>(null);
  const [loadError, setLoadError] = useState<{ status: number; message: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const loaded = await getProject(projectId);
      setProject(loaded);
      setLoadError(null);
      replaceProject(loaded);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return router.replace("/login");
      setLoadError({
        status: error instanceof ApiError ? error.status : 0,
        message: error instanceof ApiError ? error.message : "Something went wrong. Please try again.",
      });
    }
  }, [projectId, replaceProject, router]);

  useLoad(load);

  // The tabs read the open project from this value.
  const contextValue = useMemo(() => (project ? { project, refreshProject: load } : null), [project, load]);

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-12 text-center sm:px-6">
        <p role="alert" className="rounded-card border border-danger-line bg-danger-soft px-4 py-3 text-danger">
          {loadError.status === 404 ? "This project does not exist (it may have been deleted)." : loadError.message}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          {loadError.status !== 404 && (
            <button type="button" onClick={() => void load()} className={buttonClass("secondary")}>
              Try again
            </button>
          )}
          <Link href="/projects" className={buttonClass("secondary")}>
            All projects
          </Link>
        </div>
      </div>
    );
  }

  if (!project || !contextValue) {
    return (
      <p role="status" className="px-4 py-12 text-center text-ink-muted">
        Loading project...
      </p>
    );
  }

  const base = `/projects/${project.project_id}`;
  const tabs = [
    { href: base, label: "Chats" },
    { href: `${base}/tasks`, label: "Tasks" },
    { href: `${base}/notes`, label: "Notes" },
  ];

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteProject(projectId);
    setDeleting(false);
    if (result.ok) router.push("/projects");
    else setDeleteError(result.message);
  }

  return (
    <ProjectContext value={contextValue}>
      <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6 sm:px-6">
        <Link href="/projects" className="inline-flex min-h-10 items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeftIcon className="size-4" />
          All projects
        </Link>

        {editing ? (
          <div className="mt-2 max-w-xl rounded-card border border-line-strong bg-surface p-4">
            <h1 className="mb-4 text-lg font-semibold text-ink">Edit project</h1>
            <ProjectForm
              autoFocus
              initialTitle={project.title}
              initialDescription={project.description}
              submitLabel="Save changes"
              busyLabel="Saving..."
              onCancel={() => setEditing(false)}
              onSubmit={async (title, description) => {
                const result = await updateProject(projectId, { title, description });
                if (result.ok) {
                  setProject(result.value);
                  setEditing(false);
                  return null;
                }
                return { field: result.status === 409 || result.status === 422 ? "title" : "form", message: result.message };
              }}
            />
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
            <div className="min-w-0 max-w-2xl">
              <h1 className="break-words text-2xl font-semibold tracking-tight text-ink">{project.title}</h1>
              {project.description ? (
                <p className="mt-1.5 whitespace-pre-wrap break-words text-ink-muted">{project.description}</p>
              ) : (
                <p className="mt-1.5 text-ink-faint">No description.</p>
              )}
            </div>
            <div className="-ml-3 flex shrink-0 gap-1 sm:ml-0">
              <button type="button" onClick={() => setEditing(true)} className={buttonClass("quiet")}>
                <PencilIcon className="size-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setConfirmingDelete(true);
                }}
                className={buttonClass("quiet")}
              >
                <TrashIcon className="size-4" />
                Delete
              </button>
            </div>
          </div>
        )}

        {confirmingDelete && (
          <div className="mt-4 max-w-xl">
            <ConfirmBox
              title={`Delete "${project.title}"?`}
              detail="This also deletes all of its chats, tasks and notes. It cannot be undone."
              confirmLabel="Delete project"
              busy={deleting}
              error={deleteError}
              onConfirm={() => void confirmDelete()}
              onCancel={() => setConfirmingDelete(false)}
            />
          </div>
        )}

        <div className="mt-5 max-w-md">
          <ProgressBar progress={project.progress} />
        </div>

        <nav
          aria-label="Project sections"
          className="mt-6 flex overflow-x-auto border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`${TAB_CLASS} ${
                  active ? "border-accent text-ink" : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
          {/* The knowledge base arrives with the documents step: shown, but not usable yet. */}
          <span aria-disabled="true" className={`${TAB_CLASS} cursor-not-allowed border-transparent text-ink-faint`}>
            Documents
            <span className="rounded-full border border-line-strong px-2 py-0.5 text-xs font-normal">Soon</span>
          </span>
        </nav>

        <div className="mt-6">{children}</div>
      </div>
    </ProjectContext>
  );
}
