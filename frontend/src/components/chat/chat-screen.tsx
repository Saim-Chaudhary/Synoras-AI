"use client";

import { useEffect, useRef } from "react";

import { buttonClass } from "@/components/button";

import { useChat } from "./chat-provider";
import Composer from "./composer";
import EmptyChat from "./empty-chat";
import MessageItem from "./message-item";

// The middle of the app: the messages (or the greeting, a loading text, or an error) and the message box.
export default function ChatScreen() {
  const { messages, phase, loadError, banner, activeChatId, retryOpen, regenerate, editLast } = useChat();
  const scroller = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  // Sending a message always jumps back to the bottom.
  useEffect(() => {
    if (phase === "streaming") stickToBottom.current = true;
  }, [phase]);

  // Follow the new text, unless the user scrolled up to read something earlier.
  useEffect(() => {
    const box = scroller.current;
    if (box && stickToBottom.current) box.scrollTop = box.scrollHeight;
  });

  function handleScroll() {
    const box = scroller.current;
    if (box) stickToBottom.current = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  }

  const lastUser = messages.map((m) => m.sender).lastIndexOf("user");
  const lastReply = messages.length > 0 && messages[messages.length - 1].sender === "assistant" ? messages.length - 1 : -1;
  const busy = phase !== "idle";

  let content;
  if (loadError) {
    content = (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p role="alert" className="max-w-md rounded-xl border border-danger-line bg-danger-soft px-4 py-3 text-danger">
          {loadError}
        </p>
        {activeChatId !== null && (
          <button type="button" onClick={retryOpen} className={buttonClass("secondary")}>
            Try again
          </button>
        )}
      </div>
    );
  } else if (phase === "loading") {
    content = (
      <p role="status" className="flex flex-1 items-center justify-center text-ink-muted">
        Loading chat...
      </p>
    );
  } else if (messages.length === 0) {
    content = (
      <div className="flex flex-1 items-center justify-center py-8">
        <EmptyChat />
      </div>
    );
  } else {
    content = (
      <div className="space-y-6 py-6">
        {messages.map((message, index) => (
          <MessageItem
            key={message.key}
            message={message}
            isLastUser={index === lastUser}
            isLastReply={index === lastReply}
            busy={busy}
            onEdit={(text) => void editLast(text)}
            onRegenerate={() => void regenerate()}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scroller} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4">{content}</div>
      </div>
      <div className="mx-auto w-full max-w-3xl px-4 pb-6">
        {banner && (
          <p role="alert" className="mb-3 rounded-xl border border-danger-line bg-danger-soft px-4 py-2 text-sm text-danger">
            {banner}
          </p>
        )}
        <Composer />
      </div>
    </div>
  );
}
