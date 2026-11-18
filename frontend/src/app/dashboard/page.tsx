import { redirect } from "next/navigation";

// The old dashboard page is gone: the user's name and email now live in the sidebar.
// This redirect keeps old links and bookmarks working.
export default function DashboardPage() {
  redirect("/chat");
}
