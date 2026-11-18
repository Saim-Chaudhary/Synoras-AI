// Puts the chats into date groups for the sidebar: Today, Yesterday, Previous 7 days, ...
// A chat belongs to the day of its last activity. The groups come out newest first.

import type { ChatSummary } from "@/lib/chats";

export type ChatGroup = { label: string; chats: ChatSummary[] };

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function labelFor(updatedAt: Date, now: Date): string {
  const days = Math.round((startOfDay(now) - startOfDay(updatedAt)) / DAY);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days <= 7) return "Previous 7 days";
  if (days <= 30) return "Previous 30 days";
  return "Older";
}

export function groupChats(chats: ChatSummary[], now: Date = new Date()): ChatGroup[] {
  const groups: ChatGroup[] = [];
  for (const chat of chats) {
    const label = labelFor(new Date(chat.updated_at), now);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.chats.push(chat);
    else groups.push({ label, chats: [chat] });
  }
  return groups;
}
