import type { ReactNode } from "react";

import ProjectShell from "@/components/projects/project-shell";

// Wraps every page of one project (/projects/12, /projects/12/tasks, /projects/12/notes) in the
// project header and its tabs.
export default function ProjectLayout({ children }: { children: ReactNode }) {
  return <ProjectShell>{children}</ProjectShell>;
}
