"use client";

// A true/false value that is remembered in the browser (for example "sidebar collapsed").
// It works like useState, but survives a page refresh.

import { useCallback, useSyncExternalStore } from "react";

const memory = new Map<string, boolean>(); // used when localStorage is blocked
const listeners = new Set<() => void>();

function read(key: string, fallback: boolean): boolean {
  const remembered = memory.get(key);
  if (remembered !== undefined) return remembered;
  try {
    const stored = window.localStorage.getItem(key);
    if (stored === "1") return true;
    if (stored === "0") return false;
  } catch {
    // storage blocked: use the fallback
  }
  return fallback;
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function usePersistedBoolean(
  key: string,
  fallback: boolean,
): [boolean, (value: boolean) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key, fallback),
    () => fallback, // what the server renders
  );

  const setValue = useCallback(
    (next: boolean) => {
      memory.set(key, next);
      try {
        window.localStorage.setItem(key, next ? "1" : "0");
      } catch {
        // storage blocked: the value lives only until the page is closed
      }
      listeners.forEach((listener) => listener());
    },
    [key],
  );

  return [value, setValue];
}
