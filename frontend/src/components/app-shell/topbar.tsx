"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useChat } from "@/components/chat/chat-provider";
import IconButton from "@/components/icon-button";
import { MenuIcon, PanelRightIcon } from "@/components/icons";

import { useShell } from "./shell-context";
import ThemeToggle from "./theme-toggle";

// What the bar says outside the chat screens (the chat shows its own title).
function pageTitle(pathname: string): string {
  if (pathname === "/projects/new") return "New project";
  return "Projects";
}

// The bar above the chat: the menu button (phones only) and the chat title on the left, the
// theme and side panel buttons on the right.
export default function Topbar() {
  const { panelOpen, togglePanel, drawerOpen, openDrawer } = useShell();
  const { title: chatTitle, project: chatProject } = useChat();
  const pathname = usePathname();
  const inChat = pathname.startsWith("/chat");
  const title = inChat ? chatTitle : pageTitle(pathname);
  const project = inChat ? chatProject : null;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-line px-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-1">
        <div className="md:hidden">
          <IconButton label="Open menu" expanded={drawerOpen} onClick={openDrawer}>
            <MenuIcon />
          </IconButton>
        </div>
        {/* In a project chat the header names the project, and the name links back to it. */}
        {project && (
          <>
            <Link
              href={`/projects/${project.project_id}`}
              className="max-w-[7rem] shrink-0 truncate sm:max-w-[14rem] rounded-control px-2 py-2 text-sm text-ink-muted hover:text-ink md:px-1"
            >
              {project.title}
            </Link>
            <span aria-hidden="true" className="text-ink-faint">
              /
            </span>
          </>
        )}
        <p className="truncate px-2 text-sm font-medium text-ink md:px-1">{title}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <ThemeToggle />
        <IconButton
          label={panelOpen ? "Close side panel" : "Open side panel"}
          pressed={panelOpen}
          onClick={togglePanel}
        >
          <PanelRightIcon />
        </IconButton>
      </div>
    </header>
  );
}
