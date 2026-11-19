"use client";

// The list of the user's projects, shared by the sidebar and the Projects page. It sits above
// the pages (in the (app) layout), so a project created in one place shows up in the other.

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

import { ApiError } from "@/lib/api";
import { useLoad } from "@/lib/use-load";
import {
  createProject as createProjectApi,
  deleteProject as deleteProjectApi,
  listProjects,
  updateProject as updateProjectApi,
  type Project,
} from "@/lib/projects";

type Status = "loading" | "ready" | "error";

// What create, rename and delete give back: the project, or a sentence saying what went wrong.
type Result<T = Project> = { ok: true; value: T } | { ok: false; message: string; status: number };

type Projects = {
  projects: Project[];
  status: Status;
  errorMessage: string | null;
  refresh: () => Promise<void>;
  createProject: (title: string, description: string) => Promise<Result>;
  updateProject: (projectId: number, changes: { title?: string; description?: string }) => Promise<Result>;
  deleteProject: (projectId: number) => Promise<Result<null>>;
  replaceProject: (project: Project) => void; // a screen that already loaded a newer copy hands it over
};

const ProjectsContext = createContext<Projects | null>(null);

function statusOf(error: unknown): number {
  return error instanceof ApiError ? error.status : 0;
}

function messageOf(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const request = useRef(0); // to ignore the answer of an older request

  const goToLogin = useCallback(() => router.replace("/login"), [router]);

  const refresh = useCallback(async () => {
    const mine = ++request.current;
    try {
      const list = await listProjects();
      if (mine !== request.current) return;
      setProjects(list);
      setStatus("ready");
      setErrorMessage(null);
    } catch (error) {
      if (mine !== request.current) return;
      if (error instanceof ApiError && error.status === 401) return goToLogin();
      setStatus("error");
      setErrorMessage(messageOf(error));
    }
  }, [goToLogin]);

  useLoad(refresh); // load the list when the screen opens

  const createProject = useCallback(
    async (title: string, description: string): Promise<Result> => {
      try {
        const project = await createProjectApi(title, description);
        setProjects((list) => [project, ...list]);
        setStatus("ready");
        return { ok: true, value: project };
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) goToLogin();
        return { ok: false, message: messageOf(error), status: statusOf(error) };
      }
    },
    [goToLogin],
  );

  const updateProject = useCallback(
    async (projectId: number, changes: { title?: string; description?: string }): Promise<Result> => {
      try {
        const project = await updateProjectApi(projectId, changes);
        setProjects((list) => list.map((p) => (p.project_id === projectId ? project : p)));
        return { ok: true, value: project };
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) goToLogin();
        return { ok: false, message: messageOf(error), status: statusOf(error) };
      }
    },
    [goToLogin],
  );

  const deleteProject = useCallback(
    async (projectId: number): Promise<Result<null>> => {
      try {
        await deleteProjectApi(projectId);
        setProjects((list) => list.filter((p) => p.project_id !== projectId));
        return { ok: true, value: null };
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) goToLogin();
        return { ok: false, message: messageOf(error), status: statusOf(error) };
      }
    },
    [goToLogin],
  );

  const replaceProject = useCallback((project: Project) => {
    setProjects((list) => list.map((p) => (p.project_id === project.project_id ? project : p)));
  }, []);

  const value = useMemo<Projects>(
    () => ({ projects, status, errorMessage, refresh, createProject, updateProject, deleteProject, replaceProject }),
    [projects, status, errorMessage, refresh, createProject, updateProject, deleteProject, replaceProject],
  );

  return <ProjectsContext value={value}>{children}</ProjectsContext>;
}

export function useProjects(): Projects {
  const value = useContext(ProjectsContext);
  if (!value) throw new Error("useProjects must be used inside the projects provider");
  return value;
}
