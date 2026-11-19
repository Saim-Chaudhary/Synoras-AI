import type { ReactNode } from "react";

import { AnimatedLogo } from "@/components/animated-mark";
import ThemeToggle from "@/components/app-shell/theme-toggle";
import AuthTabs from "@/components/auth-tabs";
import Constellation from "@/components/constellation";

// The login and register pages (decisions A26).
// From 1024 px wide: a navy brand panel on the left, the form on the right.
// On a phone: the small logo on top, then the form (no card, no side panel).
// The form column is built to be quick to use: the two choices (Log in / Create account) are
// always visible in a switch, one title says where you are, one sentence says why, and the only
// big button on the page is the main action.
type Props = {
  current: "/login" | "/register";
  title: string;
  subtitle: string;
  children: ReactNode;
};

export default function AuthCard({ current, title, subtitle, children }: Props) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[5fr_6fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-navy p-12 text-on-brand lg:flex">
        <AnimatedLogo size={44} mode="ambient" tone="onDark" />
        <Constellation className="pointer-events-none absolute -right-10 top-1/2 w-[28rem] -translate-y-1/2 opacity-90" />
        <div className="relative max-w-sm">
          <p className="text-3xl font-semibold leading-tight tracking-tight">An AI assistant that remembers.</p>
          <p className="mt-3 text-on-brand/75">Chat, project workspaces and your own documents, in one place.</p>
        </div>
      </aside>

      <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-16 sm:px-6">
        <div className="absolute right-2 top-2 sm:right-4 sm:top-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[25rem]">
          <div className="mb-8 flex justify-center lg:hidden">
            <AnimatedLogo size={40} mode="ambient" />
          </div>

          <AuthTabs current={current} />

          <h1 className="mt-8 text-[26px] font-semibold leading-8 tracking-tight text-ink">{title}</h1>
          <p className="mt-1.5 text-ink-muted">{subtitle}</p>

          {children}

          <p className="mt-8 text-center text-xs text-ink-faint">Your chats stay private to your account.</p>
        </div>
      </main>
    </div>
  );
}
