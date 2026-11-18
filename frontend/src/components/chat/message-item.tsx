"use client";

import { useState } from "react";

import { buttonClass } from "@/components/button";
import { PencilIcon, RefreshIcon } from "@/components/icons";
import { formatCost, formatSeconds, plannedTierFromNote, tierLabel } from "@/lib/format";

import type { UiMessage } from "./chat-provider";
import CopyButton from "./copy-button";
import Markdown from "./markdown";

const SMALL_BUTTON =
  "inline-flex size-7 items-center justify-center rounded-md text-ink-muted hover:bg-surface-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-40";

// The small note under each reply: tier used, model, complexity, time and estimated cost.
function RoutingNote({ message }: { message: UiMessage }) {
  const routing = message.routing;
  if (!routing) return null;
  const planned = plannedTierFromNote(routing.note);
  const parts = [
    tierLabel(routing.tier),
    routing.model,
    `${routing.complexity} complexity`,
    formatSeconds(routing.seconds),
    `est. ${formatCost(routing.estimated_cost_usd)}`,
  ];
  if (planned && planned !== routing.tier) parts.push(`fell back from ${tierLabel(planned)}`);
  if (message.stopped) parts.push("stopped");
  return (
    <p className="text-xs text-ink-faint" data-testid="routing-note">
      {parts.join(" · ")}
    </p>
  );
}

type Props = {
  message: UiMessage;
  isLastUser: boolean; // can be edited
  isLastReply: boolean; // can be regenerated
  busy: boolean; // a reply is being written, so no actions
  onEdit: (text: string) => void;
  onRegenerate: () => void;
};

export default function MessageItem({ message, isLastUser, isLastReply, busy, onEdit, onRegenerate }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  if (message.sender === "user") {
    if (editing) {
      return (
        <div className="ml-auto w-full max-w-[85%] space-y-2">
          <label htmlFor="edit-message" className="sr-only">
            Edit your message
          </label>
          <textarea
            id="edit-message"
            autoFocus
            rows={3}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="block w-full resize-y rounded-2xl border border-accent bg-surface px-4 py-3 text-ink focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} className={buttonClass("secondary", "!py-1.5")}>
              Cancel
            </button>
            <button
              type="button"
              disabled={!draft.trim() || busy}
              onClick={() => {
                setEditing(false);
                onEdit(draft);
              }}
              className={buttonClass("primary", "!py-1.5")}
            >
              Save and resend
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="group ml-auto flex max-w-[85%] flex-col items-end gap-1">
        <div className="whitespace-pre-wrap break-words rounded-2xl bg-sidebar px-4 py-3 text-ink">{message.text}</div>
        {message.failed && (
          <p className="text-xs text-danger" role="status">
            Not sent.
          </p>
        )}
        <div className="flex gap-1">
          <CopyButton text={message.text} label="Copy message" />
          {isLastUser && !busy && message.id !== null && (
            <button
              type="button"
              aria-label="Edit message"
              title="Edit message"
              className={SMALL_BUTTON}
              onClick={() => {
                setDraft(message.text);
                setEditing(true);
              }}
            >
              <PencilIcon className="size-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // assistant
  return (
    <div className="space-y-2">
      {message.pending && !message.text && (
        <p role="status" className="text-ink-muted">
          {message.notice ?? "Thinking..."}
        </p>
      )}
      {message.text && <Markdown text={message.text} />}
      {message.pending && message.text && message.notice && <p className="text-xs text-ink-faint">{message.notice}</p>}
      {message.error && (
        <p role="alert" className="rounded-xl border border-danger-line bg-danger-soft px-3 py-2 text-sm text-danger">
          {message.error}
        </p>
      )}
      {!message.pending && (
        <>
          <RoutingNote message={message} />
          <div className="flex gap-1">
            {message.text && <CopyButton text={message.text} label="Copy reply" />}
            {isLastReply && !busy && (
              <button type="button" aria-label="Regenerate" title="Regenerate" className={SMALL_BUTTON} onClick={onRegenerate}>
                <RefreshIcon className="size-4" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
