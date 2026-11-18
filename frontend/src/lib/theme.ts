// Light / dark theme. The choice is saved in the browser and written on <html> as
// data-theme="light" or data-theme="dark". globals.css turns that into colors.

export type Theme = "light" | "dark";

const THEME_KEY = "synoras_theme";

// This small script runs while the browser reads the page, BEFORE the first paint, so a
// visitor who saved the dark theme never sees a light flash (Next.js guide "Preventing Flash").
// Without a saved choice it follows the computer's own light/dark setting.
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

// A tiny store, so any component can show the current theme and re-render when it changes
// (used with React's useSyncExternalStore).
const listeners = new Set<() => void>();

export function subscribeTheme(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

// What the server (which cannot know the visitor's choice) renders first.
export function getServerTheme(): Theme {
  return "light";
}

export function setTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // storage blocked: the theme still changes, it is just not remembered
  }
  listeners.forEach((listener) => listener());
}
