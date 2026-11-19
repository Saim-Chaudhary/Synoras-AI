"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeftIcon } from "@/components/icons";
import ProjectForm from "@/components/projects/project-form";
import { useProjects } from "@/components/projects/projects-provider";

// The page /projects/new: a name and an optional description (UC-5, flow 5.0).
export default function NewProjectPage() {
  const router = useRouter();
  const { createProject } = useProjects();

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6">
      <Link href="/projects" className="inline-flex min-h-10 items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeftIcon className="size-4" />
        All projects
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">New project</h1>
      <p className="mt-1.5 text-ink-muted">A project keeps its own chats, tasks and notes together.</p>

      <div className="mt-6">
        <ProjectForm
          autoFocus
          submitLabel="Create project"
          busyLabel="Creating..."
          onCancel={() => router.push("/projects")}
          onSubmit={async (title, description) => {
            const result = await createProject(title, description);
            if (result.ok) {
              router.push(`/projects/${result.value.project_id}`);
              return null;
            }
            // 409 = the name is already used, 422 = the name is empty: both belong next to the name
            return { field: result.status === 409 || result.status === 422 ? "title" : "form", message: result.message };
          }}
        />
      </div>
    </div>
  );
}
