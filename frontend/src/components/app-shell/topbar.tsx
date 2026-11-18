"use client";

import IconButton from "@/components/icon-button";
import { PanelRightIcon } from "@/components/icons";

import { useShell } from "./shell-context";
import ThemeToggle from "./theme-toggle";

// The bar above the chat: the chat title on the left, the theme and side panel buttons on the right.
export default function Topbar() {
  const { panelOpen, togglePanel } = useShell();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
      <p className="truncate text-sm font-medium text-ink">New chat</p>
      <div className="flex items-center gap-1">
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
