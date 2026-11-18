"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { useChat } from "@/components/chat/chat-provider";
import { PencilIcon, TrashIcon } from "@/components/icons";
import { groupChats } from "@/lib/group-chats";
import type { ChatSummary } from "@/lib/chats";

const ROW_BUTTON =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-surface hover:text-ink";

// One chat in the list. Normally a link; it turns into a rename box or a delete question when asked.
function ChatRow({ chat, active }: { chat: ChatSummary; active: boolean }) {
  const { renameChat, deleteChat } = useChat();
  const [mode, setMode] = useState<"view" | "rename" | "delete">("view");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submitRename(event: FormEvent) {
    event.preventDefault();
    const title = draft.trim();
    if (!title || title === chat.title) return setMode("view");
    const problem = await renameChat(chat.chat_id, title);
    if (problem) setError(problem);
    else setMode("view");
  }

  async function confirmDelete() {
    const problem = await deleteChat(chat.chat_id);
    if (problem) {
      setError(problem);
      setMode("view");
    }
  }

  if (mode === "rename") {
    return (
      <li className="px-1 py-1">
        <form onSubmit={submitRename}>
          <label htmlFor={`rename-${chat.chat_id}`} className="sr-only">
            Chat title
          </label>
          <input
            id={`rename-${chat.chat_id}`}
            autoFocus
            maxLength={150}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => event.key === "Escape" && setMode("view")}
            onBlur={() => setMode("view")}
            className="w-full rounded-lg border border-accent bg-surface px-2 py-1.5 text-sm text-ink focus:outline-none"
          />
        </form>
        {error && <p className="px-1 pt-1 text-xs text-danger">{error}</p>}
      </li>
    );
  }

  if (mode === "delete") {
    return (
      <li className="rounded-lg bg-danger-soft px-3 py-2 text-sm">
        <p className="text-danger">Delete this chat?</p>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={confirmDelete} className="rounded-md bg-danger px-2 py-1 text-xs font-medium text-canvas">
            Delete
          </button>
          <button type="button" onClick={() => setMode("view")} className="rounded-md border border-danger-line px-2 py-1 text-xs text-ink">
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className={`group flex items-center rounded-lg ${active ? "bg-highlight-soft" : "hover:bg-surface-hover"}`}>
      <Link
        href={`/chat/${chat.chat_id}`}
        aria-current={active ? "page" : undefined}
        className="min-w-0 flex-1 truncate px-3 py-2 text-sm text-ink"
      >
        {chat.title}
      </Link>
      <div className="hidden shrink-0 gap-0.5 pr-1 group-focus-within:flex group-hover:flex">
        <button
          type="button"
          aria-label={`Rename ${chat.title}`}
          title="Rename"
          className={ROW_BUTTON}
          onClick={() => {
            setDraft(chat.title);
            setError(null);
            setMode("rename");
          }}
        >
          <PencilIcon className="size-4" />
        </button>
        <button
          type="button"
          aria-label={`Delete ${chat.title}`}
          title="Delete"
          className={ROW_BUTTON}
          onClick={() => {
            setError(null);
            setMode("delete");
          }}
        >
          <TrashIcon className="size-4" />
        </button>
      </div>
    </li>
  );
}

// The list of earlier chats, grouped by date (Today, Yesterday, Previous 7 days, ...).
// The search box is in the sidebar; the server does the searching (title and message text).
export default function ChatHistory() {
  const { chats, chatsStatus, chatsError, search, activeChatId, retryChats } = useChat();

  if (chatsStatus === "loading") return <p className="px-3 py-2 text-sm text-ink-muted">Loading chats...</p>;

  if (chatsStatus === "error") {
    return (
      <div className="px-3 py-2 text-sm">
        <p role="alert" className="text-danger">
          {chatsError}
        </p>
        <button type="button" onClick={retryChats} className="mt-1 text-ink underline">
          Try again
        </button>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <p className="px-3 py-2 text-sm text-ink-muted">
        {search.trim() ? `No chats match "${search.trim()}".` : "No chats yet. Your conversations will appear here, grouped by day."}
      </p>
    );
  }

  return (
    <div>
      {groupChats(chats).map((group) => (
        <section key={group.label}>
          <h2 className="px-3 pb-1 pt-4 text-xs font-medium uppercase tracking-wide text-ink-faint">{group.label}</h2>
          <ul>
            {group.chats.map((chat) => (
              <ChatRow key={chat.chat_id} chat={chat} active={chat.chat_id === activeChatId} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
