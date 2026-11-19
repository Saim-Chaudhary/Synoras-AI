"use client";

import type { ReactNode } from "react";

import SidePanel from "./side-panel";
import Sidebar from "./sidebar";
import Topbar from "./topbar";

// The frame around every page after login:
//   [ sidebar ] [ top bar + page ] [ side panel ]
// The page (children) is shown in the middle and scrolls on its own. On a phone the sidebar is
// a drawer (opened from the top bar). "Skip to the chat" is the first stop for keyboard users.
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh bg-canvas text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-control focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-accent-ink"
      >
        Skip to the chat
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <div id="main" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto focus:outline-none">
            {children}
          </div>
        </main>
        <SidePanel />
      </div>
    </div>
  );
}
