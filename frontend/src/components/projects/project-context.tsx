"use client";

// The project that is open (the page /projects/12 and its tabs). The tabs read it with
// useProject(), and call refreshProject() after changing tasks so the progress in the header is up to date.

import { createContext, useContext } from "react";

import type { Project } from "@/lib/projects";

type OpenProject = {
  project: Project;
  refreshProject: () => Promise<void>;
};

export const ProjectContext = createContext<OpenProject | null>(null);

export function useProject(): OpenProject {
  const value = useContext(ProjectContext);
  if (!value) throw new Error("useProject must be used inside a project page");
  return value;
}
