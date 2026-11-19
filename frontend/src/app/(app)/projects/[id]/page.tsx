"use client";

// The Chats tab of a project: its conversations, and a button to start a new one inside it (FR-13).
// A chat started here belongs to the project, so the assistant is told the project's name and
// description. Its header shows the project name.

import Link from "next/link";
import { useCallback, useState } from "react";

import { buttonClass } from "@/components/button";
import ConfirmBox from "@/components/confirm-box";
import { PlusIcon, TrashIcon } from "@/components/icons";
import { useChat } from "@/components/chat/chat-provider";
import { useProject } from "@/components/projects/project-context";
import { ApiError } from "@/lib/api";
import { useLoad } from "@/lib/use-load";
import { deleteChat, type ChatSummary } from "@/lib/chats";
import { formatDate } from "@/lib/format";
import { listProjectChats } from "@/lib/projects";

export default function ProjectChatsPage() {
  const { project, refreshProject } = useProject();
  const { startProjectChat } = useChat();
  const projectId = project.project_id;

  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setChats(await listProjectChats(projectId));
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof ApiError ? error.message : "Something went wrong. Please try again.");
    }
  }, [projectId]);

  // The page starts in "loading" and is created again for every project (see project-shell.tsx).
  useLoad(load);

  async function confirmDelete(chatId: number) {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteChat(chatId);
      setChats((list) => list.filter((c) => c.chat_id !== chatId));
      setDeletingId(null);
      void refreshProject(); // the chat count
    } catch (error) {
      setDeleteError(error instanceof ApiError ? error.message : "Something went wrong. Please try again.");
    }
    setDeleteBusy(false);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Chats</h2>
        <button
          type="button"
          onClick={() => startProjectChat({ project_id: projectId, title: project.title })}
          className={buttonClass("primary")}
        >
          <PlusIcon className="size-4" />
          New chat in this project
        </button>
      </div>

      <div className="mt-4">
        {status === "loading" && (
          <p role="status" className="text-ink-muted">
            Loading chats...
          </p>
        )}

        {status === "error" && (
          <div role="alert" className="max-w-md rounded-card border border-danger-line bg-danger-soft p-4">
            <p className="text-danger">{errorMessage}</p>
            <button type="button" onClick={() => void load()} className={buttonClass("secondary", "mt-3")}>
              Try again
            </button>
          </div>
        )}

        {status === "ready" && chats.length === 0 && (
          <div className="rounded-card border border-line-strong px-6 py-10 text-center">
            <h3 className="font-semibold text-ink">No chats in this project yet</h3>
            <p className="mx-auto mt-1.5 max-w-md text-ink-muted">
              Start one and the assistant will know this project&apos;s name and description.
            </p>
          </div>
        )}

        {status === "ready" && chats.length > 0 && (
          <ul className="divide-y divide-line rounded-card border border-line-strong bg-surface">
            {chats.map((chat) => (
              <li key={chat.chat_id} className="p-1">
                {deletingId === chat.chat_id ? (
                  <ConfirmBox
                    title="Delete this chat?"
                    detail="Its messages are deleted too."
                    busy={deleteBusy}
                    error={deleteError}
                    onConfirm={() => void confirmDelete(chat.chat_id)}
                    onCancel={() => setDeletingId(null)}
                  />
                ) : (
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/chat/${chat.chat_id}`}
                      className="min-w-0 flex-1 rounded-control px-3 py-2.5 hover:bg-surface-hover"
                    >
                      <span className="block truncate text-ink">{chat.title}</span>
                      <span className="block text-xs text-ink-muted">Last active {formatDate(chat.updated_at)}</span>
                    </Link>
                    <button
                      type="button"
                      aria-label={`Delete chat ${chat.title}`}
                      title="Delete chat"
                      onClick={() => {
                        setDeleteError(null);
                        setDeletingId(chat.chat_id);
                      }}
                      className="inline-flex size-10 shrink-0 items-center justify-center rounded-control text-ink-muted hover:bg-surface-hover hover:text-ink"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
