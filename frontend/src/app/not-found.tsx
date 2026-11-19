import Link from "next/link";

import { buttonClass } from "@/components/button";
import { NotFoundArt } from "@/components/illustrations/empty-states";

// Shown for any address that does not exist (Next.js looks for this file by its name).
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 py-16 text-center">
      <NotFoundArt className="h-32 w-auto" />
      <p className="mt-6 font-mono text-sm text-ink-muted">404</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">This page could not be found</h1>
      <p className="mt-2 max-w-sm text-ink-muted">
        The address may be mistyped, or the chat or project may have been deleted.
      </p>
      <Link href="/chat" className={buttonClass("primary", "mt-8")}>
        Back to your chats
      </Link>
    </main>
  );
}
