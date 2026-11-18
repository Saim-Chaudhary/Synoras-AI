"use client";

import { useSyncExternalStore } from "react";

import IconButton from "@/components/icon-button";
import { MoonIcon, SunIcon } from "@/components/icons";
import { getServerTheme, getTheme, setTheme, subscribeTheme } from "@/lib/theme";

// Switches between the light and the dark theme. The button shows the theme you would switch TO.
export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme);
  const next = theme === "dark" ? "light" : "dark";

  return (
    <IconButton label={`Switch to ${next} theme`} onClick={() => setTheme(next)}>
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </IconButton>
  );
}
