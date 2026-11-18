"use client";

import type { ReactNode } from "react";

import AppShell from "@/components/app-shell/app-shell";
import { ShellProvider } from "@/components/app-shell/shell-context";
import StatusScreen from "@/components/status-screen";
import { useRequireAuth } from "@/lib/use-require-auth";

// Every page inside the (app) folder needs a login and is shown inside the app shell
// (sidebar, top bar, side panel). "(app)" is only a folder name for grouping: it is not part
// of the web address, so app/(app)/chat/page.tsx is the page /chat.
export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, errorMessage, logout } = useRequireAuth();

  if (errorMessage) {
    return (
      <StatusScreen
        kind="error"
        message={errorMessage}
        onRetry={() => window.location.reload()}
      />
    );
  }
  if (!user) return <StatusScreen kind="loading" />;

  return (
    <ShellProvider user={user} logout={logout}>
      <AppShell>{children}</AppShell>
    </ShellProvider>
  );
}
