"use client";

import Link from "next/link";

import { buttonClass } from "@/components/button";
import { ErrorArt } from "@/components/illustrations/empty-states";

// Shown when a page crashes while it draws (Next.js looks for this file by its name and gives it
// a `retry` function that tries to draw the page again). The technical text is not shown to the
// person, only a short reference (`digest`) that matches the server log.
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 py-16 text-center">
      <ErrorArt className="h-32 w-auto" />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-ink-muted">
        This page stopped working. Your chats are safe. Try again, or go back to your chats.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-ink-faint">Reference: {error.digest}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => retry()} className={buttonClass("primary")}>
          Try again
        </button>
        <Link href="/chat" className={buttonClass("secondary")}>
          Back to your chats
        </Link>
      </div>
    </main>
  );
}
