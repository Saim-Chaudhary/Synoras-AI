"use client";

import { useState } from "react";

import { AnimatedMark } from "@/components/animated-mark";
import { buttonClass } from "@/components/button";
import { ICON_BUTTON_CLASS } from "@/components/icon-button";
import { PencilIcon, RefreshIcon } from "@/components/icons";
import { formatCost, formatSeconds, plannedTierFromNote, tierLabel } from "@/lib/format";

import type { UiMessage } from "./chat-provider";
import CopyButton from "./copy-button";
import Markdown from "./markdown";

// The small note under each reply: tier used, model, complexity, time and estimated cost.
// Numbers are in the mono face so the columns of digits line up from one reply to the next.
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
    <p className="font-mono text-xs tabular-nums leading-5 text-ink-faint" data-testid="routing-note">
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
        <div className="ml-auto w-full max-w-[80%] space-y-2">
          <label htmlFor="edit-message" className="sr-only">
            Edit your message
          </label>
          <textarea
            id="edit-message"
            autoFocus
            rows={3}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="block w-full resize-y rounded-card border border-accent bg-surface px-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-live/40"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} className={buttonClass("secondary")}>
              Cancel
            </button>
            <button
              type="button"
              disabled={!draft.trim() || busy}
              onClick={() => {
                setEditing(false);
                onEdit(draft);
              }}
              className={buttonClass("primary")}
            >
              Save and resend
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="ml-auto flex max-w-[80%] flex-col items-end">
        <div className="whitespace-pre-wrap break-words rounded-card bg-sidebar px-4 py-3 text-[15px] leading-6 text-ink">
          {message.text}
        </div>
        {message.failed && (
          <p className="mt-1 text-xs text-danger" role="status">
            Not sent.
          </p>
        )}
        <div className="mt-1 flex">
          <CopyButton text={message.text} label="Copy message" />
          {isLastUser && !busy && message.id !== null && (
            <button
              type="button"
              aria-label="Edit message"
              title="Edit message"
              className={ICON_BUTTON_CLASS}
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

  // assistant: no bubble, the answer uses the full width of the column like a page
  return (
    <div className="space-y-2">
      {message.text && (
        <div className="text-[15px] leading-[26px]">
          <Markdown text={message.text} />
        </div>
      )}
      {message.pending && (
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <AnimatedMark size={22} mode="thinking" label="" />
          {message.notice ?? (message.text ? "Writing..." : "Thinking...")}
        </p>
      )}
      {message.error && (
        <p role="alert" className="rounded-control border border-danger-line bg-danger-soft px-3 py-2 text-sm text-danger">
          {message.error}
        </p>
      )}
      {!message.pending && (
        <div>
          <RoutingNote message={message} />
          <div className="-ml-2 mt-1 flex">
            {message.text && <CopyButton text={message.text} label="Copy reply" />}
            {isLastReply && !busy && (
              <button type="button" aria-label="Regenerate" title="Regenerate" className={ICON_BUTTON_CLASS} onClick={onRegenerate}>
                <RefreshIcon className="size-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
