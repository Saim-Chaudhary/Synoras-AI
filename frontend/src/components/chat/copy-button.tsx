"use client";

import { useEffect, useRef, useState } from "react";

import { CheckIcon, CopyIcon } from "@/components/icons";

// Copies `text` to the clipboard and shows a tick for two seconds.
// size "md" (40 px) is for the actions under a message; "sm" (32 px) sits inside a code block.
export default function CopyButton({
  text,
  label = "Copy",
  size = "md",
}: {
  text: string;
  label?: string;
  size?: "sm" | "md";
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // The browser blocked clipboard access: nothing to do, the text can still be selected by hand.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied" : label}
      className={`inline-flex items-center justify-center rounded-control text-ink-muted hover:bg-surface-hover hover:text-ink ${
        size === "md" ? "size-10" : "size-8"
      }`}
    >
      {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
    </button>
  );
}
