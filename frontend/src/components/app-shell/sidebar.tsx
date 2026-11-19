"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { buttonClass } from "@/components/button";
import { useChat } from "@/components/chat/chat-provider";
import IconButton, { ICON_BUTTON_CLASS } from "@/components/icon-button";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CloseIcon,
  LogOutIcon,
  PanelLeftIcon,
  PlusIcon,
  SearchIcon,
} from "@/components/icons";
import Logo from "@/components/logo";

import ChatHistory from "./chat-history";
import { useShell } from "./shell-context";

// The round badge with the first letter of the user's name.
function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-highlight-soft text-sm font-semibold text-ink"
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

// A heading that opens and closes its part of the sidebar (Projects, Memory).
function Section({ title, emptyText }: { title: string; emptyText: string }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="mt-4">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex min-h-10 w-full items-center gap-1 rounded-control px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-faint hover:bg-surface-hover"
      >
        {open ? <ChevronDownIcon className="size-4" /> : <ChevronRightIcon className="size-4" />}
        {title}
      </button>
      {open && <p className="px-3 py-2 text-sm text-ink-muted">{emptyText}</p>}
    </section>
  );
}

// The full sidebar: name, New chat, search, the chat list, and the account row.
// It is used twice: docked on the left (from 768 px wide) and inside the drawer on a phone.
function SidebarContent({ topRight, onNavigate }: { topRight: ReactNode; onNavigate?: () => void }) {
  const { user, logout } = useShell();
  const { search, setSearch } = useChat();

  return (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between px-3">
        <div className="flex items-center gap-2 pl-1">
          <Logo variant="mark" height={28} priority />
          <span className="font-semibold text-ink">Synoras AI</span>
        </div>
        {topRight}
      </div>

      <div className="space-y-3 px-3 pb-3">
        <Link href="/chat" onClick={onNavigate} className={buttonClass("primary", "w-full")}>
          <PlusIcon className="size-4" />
          New chat
        </Link>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            aria-label="Search chats"
            placeholder="Search chats"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 w-full rounded-control border border-line-strong bg-surface pl-9 pr-3 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-live/40"
          />
        </div>
      </div>

      <nav aria-label="Chats, projects and memory" className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <ChatHistory onNavigate={onNavigate} />
        <Section title="Projects" emptyText="No projects yet." />
        <Section title="Memory" emptyText="Nothing remembered yet." />
      </nav>

      <div className="flex shrink-0 items-center gap-3 border-t border-line p-3">
        <Avatar name={user.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{user.name}</p>
          <p className="truncate text-xs text-ink-muted">{user.email}</p>
        </div>
        <IconButton label="Log out" onClick={logout}>
          <LogOutIcon />
        </IconButton>
      </div>
    </>
  );
}

export default function Sidebar() {
  const { user, logout, sidebarCollapsed, toggleSidebar, drawerOpen, closeDrawer } = useShell();
  const closeButton = useRef<HTMLButtonElement>(null);

  // The phone drawer: Escape closes it, and the cursor starts on its close button.
  useEffect(() => {
    if (!drawerOpen) return;
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && closeDrawer();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen, closeDrawer]);

  return (
    <>
      {/* Docked sidebar, from 768 px wide. Collapsed: a narrow strip with only the icons. */}
      {sidebarCollapsed ? (
        <aside
          aria-label="Sidebar"
          className="hidden w-14 shrink-0 flex-col items-center gap-2 border-r border-line bg-sidebar py-3 md:flex"
        >
          <Logo variant="mark" height={28} priority />
          <IconButton label="Expand sidebar" onClick={toggleSidebar}>
            <PanelLeftIcon />
          </IconButton>
          <Link href="/chat" aria-label="New chat" title="New chat" className={ICON_BUTTON_CLASS}>
            <PlusIcon />
          </Link>
          <div className="mt-auto flex flex-col items-center gap-2">
            <Avatar name={user.name} />
            <IconButton label="Log out" onClick={logout}>
              <LogOutIcon />
            </IconButton>
          </div>
        </aside>
      ) : (
        <aside aria-label="Sidebar" className="hidden w-70 shrink-0 flex-col border-r border-line bg-sidebar md:flex">
          <SidebarContent
            topRight={
              <IconButton label="Collapse sidebar" onClick={toggleSidebar}>
                <PanelLeftIcon />
              </IconButton>
            }
          />
        </aside>
      )}

      {/* Phone drawer: the same sidebar, sliding in over the chat. */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div aria-hidden="true" className="absolute inset-0 bg-brand-navy/50" onClick={closeDrawer} />
          <aside
            aria-label="Sidebar"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col border-r border-line bg-sidebar shadow-xl"
          >
            <SidebarContent
              onNavigate={closeDrawer}
              topRight={
                <button
                  ref={closeButton}
                  type="button"
                  aria-label="Close menu"
                  title="Close menu"
                  onClick={closeDrawer}
                  className={ICON_BUTTON_CLASS}
                >
                  <CloseIcon />
                </button>
              }
            />
          </aside>
        </div>
      )}
    </>
  );
}
