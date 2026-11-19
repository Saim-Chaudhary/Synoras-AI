"use client";

import Link from "next/link";
import { useState, type FocusEvent, type FormEvent, type KeyboardEvent } from "react";

import { useChat } from "@/components/chat/chat-provider";
import { MoreIcon, PencilIcon, TrashIcon } from "@/components/icons";
import { buttonClass } from "@/components/button";
import { groupChats } from "@/lib/group-chats";
import type { ChatSummary } from "@/lib/chats";

// The "..." button of a row. On a screen with a mouse it only appears when the row is pointed at
// or focused; on a touch screen (no hover) it is always there.
const OPTIONS_BUTTON =
  "mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-control text-ink-muted hover:bg-surface hover:text-ink";
const OPTIONS_BUTTON_HIDDEN_UNTIL_HOVER =
  "[@media(hover:hover)]:hidden [@media(hover:hover)]:group-hover:inline-flex [@media(hover:hover)]:group-focus-within:inline-flex";

const MENU_ITEM =
  "flex min-h-10 w-full items-center gap-2 rounded-control px-3 text-left text-sm text-ink hover:bg-surface-hover";

// One chat in the list. Normally a link; it turns into a rename box or a delete question when asked.
function ChatRow({ chat, active, onNavigate }: { chat: ChatSummary; active: boolean; onNavigate?: () => void }) {
  const { renameChat, deleteChat } = useChat();
  const [mode, setMode] = useState<"view" | "rename" | "delete">("view");
  const [menuOpen, setMenuOpen] = useState(false);
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

  // Close the menu when focus leaves the row (a click elsewhere, or Tab past the last item).
  function closeMenuOnBlur(event: FocusEvent<HTMLLIElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false);
  }

  function closeMenuOnEscape(event: KeyboardEvent<HTMLLIElement>) {
    if (event.key === "Escape" && menuOpen) {
      setMenuOpen(false);
      event.currentTarget.querySelector<HTMLButtonElement>("button[aria-haspopup]")?.focus();
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
            className="h-10 w-full rounded-control border border-accent bg-raised px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-live/40"
          />
        </form>
        {error && (
          <p role="alert" className="px-1 pt-1 text-xs text-danger">
            {error}
          </p>
        )}
      </li>
    );
  }

  if (mode === "delete") {
    return (
      <li className="rounded-control bg-danger-soft px-3 py-2 text-sm" role="alertdialog" aria-label={`Delete ${chat.title}?`}>
        <p className="text-danger">Delete this chat?</p>
        <div className="mt-2 flex gap-2">
          <button type="button" autoFocus onClick={confirmDelete} className={buttonClass("danger", "!min-h-9 !px-3")}>
            Delete
          </button>
          <button type="button" onClick={() => setMode("view")} className={buttonClass("secondary", "!min-h-9 !px-3")}>
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li
      className={`group relative flex items-center rounded-control ${active ? "bg-live-soft" : "hover:bg-surface-hover"}`}
      onBlur={closeMenuOnBlur}
      onKeyDown={closeMenuOnEscape}
    >
      {active && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-live" />}
      <Link
        href={`/chat/${chat.chat_id}`}
        aria-current={active ? "page" : undefined}
        onClick={onNavigate}
        className="min-w-0 flex-1 truncate py-2.5 pl-4 pr-2 text-sm text-ink"
      >
        {chat.title}
      </Link>
      <button
        type="button"
        aria-label={`Options for ${chat.title}`}
        title="Options"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className={menuOpen ? OPTIONS_BUTTON : `${OPTIONS_BUTTON} ${OPTIONS_BUTTON_HIDDEN_UNTIL_HOVER}`}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <MoreIcon className="size-4" />
      </button>
      {menuOpen && (
        <div
          role="menu"
          aria-label={`Options for ${chat.title}`}
          className="absolute right-1 top-full z-20 mt-1 w-40 rounded-card border border-line bg-raised p-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            className={MENU_ITEM}
            onClick={() => {
              setMenuOpen(false);
              setDraft(chat.title);
              setError(null);
              setMode("rename");
            }}
          >
            <PencilIcon className="size-4" />
            Rename
          </button>
          <button
            type="button"
            role="menuitem"
            className={`${MENU_ITEM} !text-danger`}
            onClick={() => {
              setMenuOpen(false);
              setError(null);
              setMode("delete");
            }}
          >
            <TrashIcon className="size-4" />
            Delete
          </button>
        </div>
      )}
    </li>
  );
}

// The list of earlier chats, grouped by date (Today, Yesterday, Previous 7 days, ...).
// The search box is in the sidebar; the server does the searching (title and message text).
// onNavigate is called when a chat is opened (the phone drawer closes itself with it).
export default function ChatHistory({ onNavigate }: { onNavigate?: () => void }) {
  const { chats, chatsStatus, chatsError, search, activeChatId, retryChats } = useChat();

  if (chatsStatus === "loading") return <p className="px-3 py-2 text-sm text-ink-muted">Loading chats...</p>;

  if (chatsStatus === "error") {
    return (
      <div className="px-3 py-2 text-sm">
        <p role="alert" className="text-danger">
          {chatsError}
        </p>
        <button type="button" onClick={retryChats} className="mt-1 min-h-10 text-ink underline">
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
          <h2 className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-faint">{group.label}</h2>
          <ul className="space-y-0.5">
            {group.chats.map((chat) => (
              <ChatRow key={chat.chat_id} chat={chat} active={chat.chat_id === activeChatId} onNavigate={onNavigate} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
