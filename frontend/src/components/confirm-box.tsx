"use client";

// A question that appears where the person clicked "Delete", instead of a pop-up window.
// The safe choice (Cancel) is always visible, the cursor starts on it, and Escape cancels, so
// a click or a key press by mistake does not delete anything.

import { useEffect, useRef } from "react";

import { buttonClass } from "@/components/button";

type Props = {
  title: string; // for example "Delete this task?"
  detail?: string; // what else will happen (BR-13)
  confirmLabel?: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmBox({ title, detail, confirmLabel = "Delete", busy, error, onConfirm, onCancel }: Props) {
  const cancelButton = useRef<HTMLButtonElement>(null);
  useEffect(() => cancelButton.current?.focus(), []);

  return (
    <div
      role="alertdialog"
      aria-label={title}
      onKeyDown={(event) => event.key === "Escape" && onCancel()}
      className="rounded-card border border-danger-line bg-danger-soft p-3 text-sm"
    >
      <p className="font-medium text-danger">{title}</p>
      {detail && <p className="mt-1 text-ink-muted">{detail}</p>}
      {error && (
        <p role="alert" className="mt-2 text-danger">
          {error}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button ref={cancelButton} type="button" onClick={onCancel} className={buttonClass("secondary", "!min-h-9 !px-3")}>
          Cancel
        </button>
        <button type="button" disabled={busy} onClick={onConfirm} className={buttonClass("danger", "!min-h-9 !px-3")}>
          {busy ? "Deleting..." : confirmLabel}
        </button>
      </div>
    </div>
  );
}
