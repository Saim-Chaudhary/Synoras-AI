import { redirect } from "next/navigation";

// The home page has nothing of its own. Send everybody to the chat, which sends visitors
// without a valid login on to /login.
export default function Home() {
  redirect("/chat");
}
