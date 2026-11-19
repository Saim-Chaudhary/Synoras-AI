"use client";

// "Load this when the screen opens" (and again when `load` changes, for example another project).
// The loader is started a moment later instead of inside the effect itself, so the screen can
// show its first state ("Loading...") and no state is set while React is still rendering
// (the lint rule react-hooks/set-state-in-effect). Pass a function made with useCallback.

import { useEffect } from "react";

export function useLoad(load: () => void | Promise<void>): void {
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
}
