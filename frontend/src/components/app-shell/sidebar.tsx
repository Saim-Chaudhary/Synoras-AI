"use client";

import Link from "next/link";
import { useState } from "react";

import { buttonClass } from "@/components/button";
import IconButton, { ICON_BUTTON_CLASS } from "@/components/icon-button";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  LogOutIcon,
  PanelLeftIcon,
  PlusIcon,
  SearchIcon,
} from "@/components/icons";
import Logo from "@/components/logo";

import { useChat } from "@/components/chat/chat-provider";

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
        className="flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-ink-faint hover:bg-surface-hover"
      >
        {open ? <ChevronDownIcon className="size-4" /> : <ChevronRightIcon className="size-4" />}
        {title}
      </button>
      {open && <p className="px-3 py-2 text-sm text-ink-muted">{emptyText}</p>}
    </section>
  );
}

export default function Sidebar() {
  const { user, logout, sidebarCollapsed, toggleSidebar } = useShell();
  const { search, setSearch } = useChat();

  // Collapsed: a narrow strip with only the icons.
  if (sidebarCollapsed) {
    return (
      <aside
        aria-label="Sidebar"
        className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-line bg-sidebar py-3"
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
    );
  }

  return (
    <aside
      aria-label="Sidebar"
      className="flex w-72 shrink-0 flex-col border-r border-line bg-sidebar"
    >
      <div className="flex h-14 shrink-0 items-center justify-between px-3">
        <div className="flex items-center gap-2 pl-1">
          <Logo variant="mark" height={28} priority />
          <span className="font-semibold text-ink">Synoras AI</span>
        </div>
        <IconButton label="Collapse sidebar" onClick={toggleSidebar}>
          <PanelLeftIcon />
        </IconButton>
      </div>

      <div className="space-y-3 px-3 pb-3">
        <Link href="/chat" className={buttonClass("primary", "w-full")}>
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
            className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      <nav aria-label="Chats, projects and memory" className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <ChatHistory />
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
    </aside>
  );
}
