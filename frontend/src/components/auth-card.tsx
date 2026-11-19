import Link from "next/link";
import type { ReactNode } from "react";

import { AnimatedLogo } from "@/components/animated-mark";
import ThemeToggle from "@/components/app-shell/theme-toggle";
import { EyeIcon, MemoryIcon, RouteIcon } from "@/components/icons";
import MemoryScene from "@/components/illustrations/memory-scene";
import RoutingScene from "@/components/illustrations/routing-scene";
import { Entrance } from "@/components/motion/safe-motion";
import { BackgroundBeams } from "@/components/ui/background-beams";

// The login and register pages (decisions A26, A28, A29).
// From 1024 px wide: a dark brand panel on the left (logo, one promise, three benefits and a large
// picture), the form on the right. On a phone: a compact header (logo, promise, a small copy of the
// picture), then the form. The form column has one loud element (the main button) and one quiet way
// to the other page: a plain line under the form ("New to Synoras? Create an account").
// The picture says one thing each: login shows how memory works, register shows how a model is chosen.
type Props = {
  title: string;
  subtitle: string;
  switchPrompt: string; // "New to Synoras?"
  switchLabel: string; // "Create an account"
  switchHref: "/login" | "/register";
  art: "memory" | "routing";
  children: ReactNode;
};

const PROMISE = "An AI that remembers, and tells you what it remembered.";

const BENEFITS = [
  { icon: MemoryIcon, text: "Memory that stays accurate" },
  { icon: RouteIcon, text: "The right model for each task" },
  { icon: EyeIcon, text: "See what the AI used" },
];

export default function AuthCard({ title, subtitle, switchPrompt, switchLabel, switchHref, art, children }: Props) {
  const Scene = art === "memory" ? MemoryScene : RoutingScene;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[5fr_6fr]">
      {/* phone and tablet: compact header */}
      <header className="flex items-center justify-between gap-4 bg-panel px-5 py-4 text-on-panel lg:hidden">
        <div className="min-w-0">
          <AnimatedLogo size={30} mode="ambient" tone="onDark" />
          <p className="mt-3 max-w-[16rem] text-sm leading-5 text-on-panel/85">{PROMISE}</p>
        </div>
        <Scene compact className="h-40 w-auto shrink-0" />
      </header>

      {/* desktop: the brand panel */}
      <aside className="relative hidden min-h-dvh flex-col overflow-hidden bg-panel px-12 py-10 text-on-panel lg:flex xl:px-14">
        <BackgroundBeams />
        <Entrance className="relative">
          <AnimatedLogo size={44} mode="ambient" tone="onDark" />
          <h2 className="mt-7 max-w-md text-[26px] font-semibold leading-8 tracking-tight">{PROMISE}</h2>
          <ul className="mt-6 space-y-3">
            {BENEFITS.map(({ icon: BenefitIcon, text }) => (
              <li key={text} className="flex items-center gap-3 text-[15px] text-on-panel/90">
                <span className="flex size-8 items-center justify-center rounded-full border border-on-panel/25 text-panel-teal">
                  <BenefitIcon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </Entrance>
        <div className="relative mt-6 min-h-0 flex-1">
          <Scene className="absolute inset-0 h-full w-full" />
        </div>
      </aside>

      <main className="relative flex min-h-[calc(100dvh-6.5rem)] flex-col items-center justify-center px-5 py-16 sm:px-8 lg:min-h-dvh">
        <div className="absolute right-2 top-2 sm:right-4 sm:top-4">
          <ThemeToggle />
        </div>

        <Entrance className="w-full max-w-[24rem]">
          <div>
            <h1 className="text-[32px] font-semibold leading-[38px] tracking-tight text-ink">{title}</h1>
            <p className="mt-2 text-base text-ink-muted">{subtitle}</p>
          </div>

          <div className="mt-8">{children}</div>

          <div>
            <p className="mt-8 text-center text-[15px] text-ink-muted">
              {switchPrompt}{" "}
              <Link
                href={switchHref}
                className="inline-flex min-h-10 items-center font-medium text-accent underline underline-offset-4 hover:text-accent-hover"
              >
                {switchLabel}
              </Link>
            </p>
            <p className="mt-2 text-center text-xs text-ink-faint">Your chats stay private to your account.</p>
          </div>
        </Entrance>
      </main>
    </div>
  );
}
