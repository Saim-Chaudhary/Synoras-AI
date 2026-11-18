"use client";

import { useState, type FormEvent } from "react";

import { ArrowUpIcon } from "@/components/icons";

// The message box at the bottom of the chat: a large rounded input with a Send button.
// For now it cannot send (the chat feature plugs into it later), so `disabled` is on and
// `note` explains why.
type Props = {
  disabled?: boolean;
  note?: string;
};

export default function Composer({ disabled = false, note }: Props) {
  const [text, setText] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); // the chat feature will send the message here
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-line bg-surface p-3 focus-within:border-accent"
      >
        <label htmlFor="message" className="sr-only">
          Message Synoras AI
        </label>
        <textarea
          id="message"
          rows={2}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Message Synoras AI"
          className="block w-full resize-none bg-transparent px-2 py-1 text-ink focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="px-2 text-xs text-ink-faint">{note}</p>
          <button
            type="submit"
            aria-label="Send message"
            disabled={disabled || !text.trim()}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowUpIcon />
          </button>
        </div>
      </form>
      <p className="mt-2 text-center text-xs text-ink-faint">
        Synoras AI can make mistakes. Check important information.
      </p>
    </div>
  );
}
