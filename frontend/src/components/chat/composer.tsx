"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";

import { ArrowUpIcon, StopIcon } from "@/components/icons";

import { useChat } from "./chat-provider";

// The message box at the bottom of the chat. Enter sends, Shift+Enter makes a new line.
// While a reply is being written the Send button becomes "Stop generating".
export default function Composer() {
  const { phase, send, stop } = useChat();
  const [text, setText] = useState("");
  const streaming = phase === "streaming";

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!text.trim() || phase !== "idle") return;
    void send(text);
    setText("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div>
      <form onSubmit={submit} className="rounded-3xl border border-line bg-surface p-3 focus-within:border-accent">
        <label htmlFor="message" className="sr-only">
          Message Synoras AI
        </label>
        <textarea
          id="message"
          rows={2}
          value={text}
          maxLength={8000}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Synoras AI"
          className="block max-h-48 w-full resize-none overflow-y-auto bg-transparent px-2 py-1 text-ink [field-sizing:content] focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="px-2 text-xs text-ink-faint">Enter to send, Shift+Enter for a new line</p>
          {streaming ? (
            <button
              type="button"
              onClick={stop}
              aria-label="Stop generating"
              title="Stop generating"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink hover:bg-accent-hover"
            >
              <StopIcon />
            </button>
          ) : (
            <button
              type="submit"
              aria-label="Send message"
              disabled={phase !== "idle" || !text.trim()}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
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
