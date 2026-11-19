"use client";

import { type FormEvent, type KeyboardEvent } from "react";

import { ArrowUpIcon, StopIcon } from "@/components/icons";

import { useChat } from "./chat-provider";

// The message box at the bottom of the chat. Enter sends, Shift+Enter makes a new line.
// While a reply is being written the Send button becomes "Stop generating" (amber: the live point).
// The text lives in the chat screen (value / onChange), so the starter prompts can fill it.
type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function Composer({ value, onChange }: Props) {
  const { phase, send, stop } = useChat();
  const streaming = phase === "streaming";

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!value.trim() || phase !== "idle") return;
    void send(value);
    onChange("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div>
      <form
        onSubmit={submit}
        className="rounded-composer border border-line-strong bg-raised p-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-live/40"
      >
        <label htmlFor="message" className="sr-only">
          Message Synoras AI
        </label>
        <textarea
          id="message"
          rows={2}
          value={value}
          maxLength={8000}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Synoras AI"
          className="block max-h-52 w-full resize-none overflow-y-auto bg-transparent px-2 py-1 text-[15px] leading-6 text-ink [field-sizing:content] focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="hidden px-2 text-xs text-ink-faint sm:block">Enter to send, Shift+Enter for a new line</p>
          {streaming ? (
            <button
              type="button"
              onClick={stop}
              aria-label="Stop generating"
              title="Stop generating"
              className="ml-auto inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-live text-live-ink hover:opacity-90"
            >
              <StopIcon />
            </button>
          ) : (
            <button
              type="submit"
              aria-label="Send message"
              disabled={phase !== "idle" || !value.trim()}
              className="ml-auto inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowUpIcon />
            </button>
          )}
        </div>
      </form>
      <p className="mt-2 text-center text-xs text-ink-faint">Synoras AI can make mistakes. Check important information.</p>
    </div>
  );
}
