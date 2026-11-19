// The chat API: one function per backend endpoint (see backend/app/api/chats.py).
// Every call needs a login, so they all go through authFetch.

import { authFetch } from "@/lib/auth";

export type ChatSummary = {
  chat_id: number;
  project_id: number | null; // empty for a personal chat
  title: string;
  created_at: string;
  updated_at: string;
};

// How a reply was routed. It is shown as the small note under each reply.
export type Routing = {
  complexity: string;
  tier: string;
  model: string;
  seconds: number;
  estimated_cost_usd: number | null;
  note: string | null;
};

export type ServerMessage = {
  message_id: number;
  sender: "user" | "assistant";
  text: string;
  model_used: string | null;
  created_at: string;
  routing: Routing | null;
};

// The project a chat belongs to (shown in the chat's header).
export type ProjectRef = { project_id: number; title: string };

export type ChatDetail = ChatSummary & { project: ProjectRef | null; messages: ServerMessage[] };

export function listChats(query?: string): Promise<ChatSummary[]> {
  const search = query?.trim();
  return authFetch<ChatSummary[]>(search ? `/chats?q=${encodeURIComponent(search)}` : "/chats");
}

export function createChat(): Promise<ChatSummary> {
  return authFetch<ChatSummary>("/chats", { method: "POST" });
}

export function getChat(chatId: number): Promise<ChatDetail> {
  return authFetch<ChatDetail>(`/chats/${chatId}`);
}

export function renameChat(chatId: number, title: string): Promise<ChatSummary> {
  return authFetch<ChatSummary>(`/chats/${chatId}`, { method: "PATCH", body: { title } });
}

export function deleteChat(chatId: number): Promise<void> {
  return authFetch<void>(`/chats/${chatId}`, { method: "DELETE" });
}
