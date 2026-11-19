"use client";

// The form to add or edit a task: a title, an optional description and an optional due date (FR-12).
// A task without a title is not accepted. Same form rules as the rest of the app (decisions A26).

import { useEffect, useId, useState, type FormEvent } from "react";

import { buttonClass } from "@/components/button";
import { AlertIcon } from "@/components/icons";
import TextAreaField from "@/components/textarea-field";
import TextField from "@/components/text-field";
import { checkTitle } from "@/lib/validation";

type Props = {
  initialTitle?: string;
  initialDescription?: string;
  initialDueDate?: string | null;
  submitLabel: string;
  busyLabel: string;
  // Returns null when it worked, or a sentence saying what went wrong.
  onSubmit: (values: { title: string; description: string; due_date: string | null }) => Promise<string | null>;
  onCancel: () => void;
};

export default function TaskForm({
  initialTitle = "",
  initialDescription = "",
  initialDueDate = null,
  submitLabel,
  busyLabel,
  onSubmit,
  onCancel,
}: Props) {
  const id = useId(); // each open form has its own ids (several can exist at once)
  const titleId = `${id}-title`;
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [dueDate, setDueDate] = useState(initialDueDate ?? "");
  const [titleTouched, setTitleTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) document.getElementById(titleId)?.focus();
  }, [titleId]);

  const titleError = titleTouched ? checkTitle(title, "task title") : undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setTitleTouched(true);
    if (checkTitle(title, "task title")) {
      document.getElementById(titleId)?.focus();
      return;
    }
    setBusy(true);
    const problem = await onSubmit({ title: title.trim(), description: description.trim(), due_date: dueDate || null });
    setBusy(false);
    if (problem) setFormError(problem);
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(event) => event.key === "Escape" && onCancel()}
      noValidate
      className="rounded-card border border-accent bg-surface p-3"
    >
      <TextField
        id={titleId}
        label="Task title"
        className="mt-0"
        value={title}
        onChange={setTitle}
        onBlur={() => setTitleTouched(true)}
        error={titleError}
      />
      <TextAreaField
        id={`${id}-description`}
        label="Description"
        optional
        rows={2}
        maxLength={2000}
        value={description}
        onChange={setDescription}
      />
      <TextField id={`${id}-due`} label="Due date (optional)" type="date" className="mt-4" value={dueDate} onChange={setDueDate} />

      {formError && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-control border border-danger-line bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          <AlertIcon className="mt-0.5 size-4 shrink-0" />
          {formError}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className={buttonClass("primary", "!min-h-9 !px-3")}>
          {busy ? busyLabel : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className={buttonClass("secondary", "!min-h-9 !px-3")}>
          Cancel
        </button>
      </div>
    </form>
  );
}
