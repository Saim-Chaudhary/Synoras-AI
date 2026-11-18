import type { ReactNode } from "react";

import Logo from "@/components/logo";

// The card in the middle of the login and register pages, as in the Register / Log In mockup.
export default function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8">
        <div className="flex justify-center">
          <Logo variant="full" height={44} priority />
        </div>
        <h1 className="mt-6 text-center text-xl font-semibold text-ink">{title}</h1>
        {children}
      </div>
    </main>
  );
}
