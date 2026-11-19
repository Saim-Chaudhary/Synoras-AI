"use client";

import { useState } from "react";

import { useShell } from "@/components/app-shell/shell-context";
import { EmptyChatArt } from "@/components/illustrations/empty-states";
import { Greeting } from "@/components/motion/safe-motion";

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// Ideas to start with. Picking one only fills the message box; the person still presses Send.
const STARTERS = [
  "Explain something in simple words",
  "Help me plan my week",
  "Write a short code example and explain it",
];

// What an empty chat shows: a small picture, a greeting with the user's first name, and a few ideas.
export default function EmptyChat({ onPick }: { onPick: (text: string) => void }) {
  const { user } = useShell();
  const [greeting] = useState(() => greetingFor(new Date().getHours()));
  const firstName = user.name.trim().split(/\s+/)[0];

  return (
    <div className="flex flex-col items-center px-2 text-center">
      <EmptyChatArt className="h-28 w-auto" />
      <Greeting text={`${greeting}, ${firstName}`} className="mt-6 text-3xl font-semibold leading-9 tracking-tight text-ink" />
      <p className="mt-2 text-ink-muted">How can I help you today?</p>
      <ul className="mt-8 flex flex-wrap justify-center gap-2">
        {STARTERS.map((text) => (
          <li key={text}>
            <button
              type="button"
              onClick={() => onPick(text)}
              className="min-h-10 rounded-full border border-line-strong bg-raised px-4 py-2 text-sm text-ink hover:bg-surface-hover"
            >
              {text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
