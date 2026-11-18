import { redirect } from "next/navigation";

// The home page has nothing of its own yet. Send everybody to the dashboard,
// which sends them on to /login if they are not logged in.
export default function Home() {
  redirect("/dashboard");
}
