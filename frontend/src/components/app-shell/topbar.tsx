"use client";

import { useChat } from "@/components/chat/chat-provider";
import IconButton from "@/components/icon-button";
import { MenuIcon, PanelRightIcon } from "@/components/icons";

import { useShell } from "./shell-context";
import ThemeToggle from "./theme-toggle";

// The bar above the chat: the menu button (phones only) and the chat title on the left, the
// theme and side panel buttons on the right.
export default function Topbar() {
  const { panelOpen, togglePanel, drawerOpen, openDrawer } = useShell();
  const { title } = useChat();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-line px-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-1">
        <div className="md:hidden">
          <IconButton label="Open menu" expanded={drawerOpen} onClick={openDrawer}>
            <MenuIcon />
          </IconButton>
        </div>
        <p className="truncate px-2 text-sm font-medium text-ink md:px-0">{title}</p>
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
