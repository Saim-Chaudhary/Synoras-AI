"use client";

import IconButton from "@/components/icon-button";
import { CloseIcon } from "@/components/icons";
import Logo from "@/components/logo";

import { useShell } from "./shell-context";

// The panel's future sections. They are shown disabled for now, so the panel already has the
// shape it will have (decisions A21): the knowledge graph, memories and sources open here.
const TABS = ["Memories", "Knowledge graph", "Sources"];

// The panel that opens beside the chat. From 1280 px wide it sits next to the chat; on
// narrower screens it covers the right edge (with a shadow, like a drawer).
export default function SidePanel() {
  const { panelOpen, closePanel } = useShell();
  if (!panelOpen) return null;

  return (
    <aside
      aria-label="Side panel"
      className="fixed inset-y-0 right-0 z-30 flex w-[min(24rem,100vw)] flex-col border-l border-line bg-surface shadow-xl xl:static xl:z-auto xl:w-96 xl:shrink-0 xl:shadow-none"
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-line pl-4 pr-2">
        <h2 className="text-sm font-medium text-ink">Side panel</h2>
        <IconButton label="Close side panel" onClick={closePanel}>
          <CloseIcon />
        </IconButton>
      </div>
      <div role="tablist" aria-label="Panel sections" className="flex gap-1 border-b border-line px-3 py-2">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected="false"
            disabled
            className="min-h-9 rounded-control px-3 text-sm text-ink-faint disabled:cursor-not-allowed disabled:opacity-70"
          >
            {name}
          </button>
        ))}
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <Logo variant="mark" height={36} />
        <p className="font-medium text-ink">Nothing open yet</p>
        <p className="text-sm text-ink-muted">
          The knowledge graph, memory conflicts and source references will open here, beside your chat.
        </p>
      </div>
    </aside>
  );
}
