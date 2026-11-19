import Link from "next/link";

// The two-way switch at the top of the login and register pages: "Log in | Create account".
// It shows both choices at once (nothing to remember), says where you are, and uses the same
// words as the buttons (one label per intent). They are links, so the browser's Back button works.
const TABS = [
  { href: "/login", label: "Log in" },
  { href: "/register", label: "Create account" },
] as const;

export default function AuthTabs({ current }: { current: "/login" | "/register" }) {
  return (
    <nav aria-label="Log in or create an account" className="flex rounded-control border border-line-strong bg-sidebar p-1">
      {TABS.map((tab) => {
        const active = tab.href === current;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-10 flex-1 items-center justify-center rounded-control px-3 text-sm font-medium ${
              active ? "bg-surface text-ink ring-1 ring-line" : "text-ink-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
