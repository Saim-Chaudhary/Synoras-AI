"use client";

import IconButton from "@/components/icon-button";
import { CloseIcon } from "@/components/icons";
import Logo from "@/components/logo";

import { useShell } from "./shell-context";

// The panel that opens beside the chat. It is empty for now. Later it will hold the live
// knowledge graph, memory conflicts and source references (decisions A21).
// From 1280 px wide it sits next to the chat; on narrower screens it covers the right edge.
export default function SidePanel() {
  const { panelOpen, closePanel } = useShell();
  if (!panelOpen) return null;

  return (
    <aside
      aria-label="Side panel"
      className="fixed inset-y-0 right-0 z-30 flex w-[min(24rem,100vw)] flex-col border-l border-line bg-surface xl:static xl:z-auto xl:w-96 xl:shrink-0"
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
        <h2 className="text-sm font-medium text-ink">Side panel</h2>
        <IconButton label="Close side panel" onClick={closePanel}>
          <CloseIcon />
        </IconButton>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <Logo variant="mark" height={36} />
        <p className="font-medium text-ink">Nothing open yet</p>
        <p className="text-sm text-ink-muted">
          The knowledge graph, memory conflicts and source references will open here, beside your
          chat.
        </p>
      </div>
    </aside>
  );
}
