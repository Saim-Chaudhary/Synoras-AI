"use client";

// The state that the shell's parts share: who is logged in, whether the sidebar is collapsed,
// and whether the side panel is open. Any component inside the shell reads it with useShell().

import { createContext, useContext, useState, type ReactNode } from "react";

import type { User } from "@/lib/auth";
import { usePersistedBoolean } from "@/lib/use-persisted";

type Shell = {
  user: User;
  logout: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  panelOpen: boolean;
  togglePanel: () => void;
  closePanel: () => void;
};

const ShellContext = createContext<Shell | null>(null);

export function ShellProvider({
  user,
  logout,
  children,
}: {
  user: User;
  logout: () => void;
  children: ReactNode;
}) {
  // The sidebar choice is remembered between visits. The side panel always starts closed.
  const [sidebarCollapsed, setSidebarCollapsed] = usePersistedBoolean(
    "synoras_sidebar_collapsed",
    false,
  );
  const [panelOpen, setPanelOpen] = useState(false);

  const value: Shell = {
    user,
    logout,
    sidebarCollapsed,
    toggleSidebar: () => setSidebarCollapsed(!sidebarCollapsed),
    panelOpen,
    togglePanel: () => setPanelOpen(!panelOpen),
    closePanel: () => setPanelOpen(false),
  };

  return <ShellContext value={value}>{children}</ShellContext>;
}

export function useShell(): Shell {
  const value = useContext(ShellContext);
  if (!value) throw new Error("useShell must be used inside the app shell");
  return value;
}
