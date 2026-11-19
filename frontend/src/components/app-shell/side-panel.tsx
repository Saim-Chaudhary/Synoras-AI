"use client";

import { AnimatePresence, motion } from "motion/react";

import IconButton from "@/components/icon-button";
import { CloseIcon } from "@/components/icons";
import { EmptyGraphArt, NoMemoriesArt } from "@/components/illustrations/empty-states";
import { useDuration } from "@/components/motion/safe-motion";

import { useShell } from "./shell-context";

// The panel's future sections. They are shown disabled for now, so the panel already has the
// shape it will have (decisions A21): the knowledge graph, memories and sources open here.
const TABS = ["Memories", "Knowledge graph", "Sources"];

// The panel that opens beside the chat. From 1280 px wide it sits next to the chat; on
// narrower screens it covers the right edge (with a shadow, like a drawer).
export default function SidePanel() {
  const { panelOpen, closePanel } = useShell();
  const duration = useDuration(0.2); // 0 when the person asked for less motion

  return (
    <AnimatePresence initial={false}>
    {panelOpen && (
    <motion.aside
      key="panel"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration }}
      aria-label="Side panel"
      className="fixed inset-y-0 right-0 z-30 flex w-[min(24rem,100vw)] flex-col border-l border-line bg-raised shadow-xl xl:static xl:z-auto xl:w-96 xl:shrink-0 xl:shadow-none"
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
      <div className="flex flex-1 flex-col justify-center gap-8 overflow-y-auto px-8 py-6 text-center">
        <section aria-label="Memories" className="flex flex-col items-center gap-2">
          <NoMemoriesArt className="h-24 w-auto" />
          <p className="font-medium text-ink">No memories yet</p>
          <p className="text-sm text-ink-muted">What Synoras remembers about you will show here, with how sure it is.</p>
        </section>
        <section aria-label="Knowledge graph" className="flex flex-col items-center gap-2">
          <EmptyGraphArt className="h-24 w-auto" />
          <p className="font-medium text-ink">No knowledge graph yet</p>
          <p className="text-sm text-ink-muted">Upload documents and the graph built from them will light up here.</p>
        </section>
      </div>
    </motion.aside>
    )}
    </AnimatePresence>
  );
}
