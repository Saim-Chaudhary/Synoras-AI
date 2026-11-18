"use client";

import type { ReactNode } from "react";

import SidePanel from "./side-panel";
import Sidebar from "./sidebar";
import Topbar from "./topbar";

// The frame around every page after login:
//   [ sidebar ] [ top bar + page ] [ side panel ]
// The page (children) is shown in the middle and scrolls on its own.
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh bg-canvas text-ink">
      <Sidebar />
      <div className="flex min-w-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </main>
        <SidePanel />
      </div>
    </div>
  );
}
