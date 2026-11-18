"use client";

import { useState } from "react";

import Logo from "@/components/logo";
import { useShell } from "@/components/app-shell/shell-context";

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// What an empty chat shows: the mark, a greeting with the user's first name, and an invitation.
export default function EmptyChat() {
  const { user } = useShell();
  const [greeting] = useState(() => greetingFor(new Date().getHours()));
  const firstName = user.name.trim().split(/\s+/)[0];

  return (
    <div className="flex flex-col items-center px-6 text-center">
      <Logo variant="mark" height={52} priority />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink">
        {greeting}, {firstName}
      </h1>
      <p className="mt-2 text-ink-muted">How can I help you today?</p>
    </div>
  );
}
