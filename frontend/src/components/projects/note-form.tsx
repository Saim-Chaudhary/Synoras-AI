"use client";

// The form to write or edit a note of a project: a type (Summary or Decision), a title and the text (FR-11).

import { useEffect, useId, useState, type FormEvent } from "react";

import { buttonClass } from "@/components/button";
import { AlertIcon } from "@/components/icons";
import TextAreaField from "@/components/textarea-field";
import TextField from "@/components/text-field";
import { NOTE_KIND_LABELS, type NoteKind } from "@/lib/projects";
import { checkTitle } from "@/lib/validation";

type Props = {
  initialKind?: NoteKind;
  initialTitle?: string;
  initialContent?: string;
  submitLabel: string;
  busyLabel: string;
  onSubmit: (values: { kind: NoteKind; title: string; content: string }) => Promise<string | null>;
  onCancel: () => void;
};

export default function NoteForm({
  initialKind = "decision",
  initialTitle = "",
  initialContent = "",
  submitLabel,
  busyLabel,
  onSubmit,
  onCancel,
}: Props) {
  const id = useId();
  const titleId = `${id}-title`;
  const [kind, setKind] = useState<NoteKind>(initialKind);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [titleTouched, setTitleTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) document.getElementById(titleId)?.focus();
  }, [titleId]);

  const titleError = titleTouched ? checkTitle(title, "title for the note") : undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setTitleTouched(true);
    if (checkTitle(title, "title for the note")) {
      document.getElementById(titleId)?.focus();
      return;
    }
    setBusy(true);
    const problem = await onSubmit({ kind, title: title.trim(), content: content.trim() });
    setBusy(false);
    if (problem) setFormError(problem);
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(event) => event.key === "Escape" && onCancel()}
      noValidate
      className="rounded-card border border-accent bg-surface p-4"
    >
      <div>
        <label htmlFor={`${id}-kind`} className="block text-sm font-medium text-ink">
          Type
        </label>
        <select
          id={`${id}-kind`}
          value={kind}
          onChange={(event) => setKind(event.target.value as NoteKind)}
          className="mt-1.5 block h-12 w-full rounded-control border border-line-strong bg-surface px-3 text-base text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-live/40 sm:w-60"
        >
          {(Object.keys(NOTE_KIND_LABELS) as NoteKind[]).map((value) => (
            <option key={value} value={value}>
              {NOTE_KIND_LABELS[value]}
            </option>
          ))}
        </select>
      </div>
      <TextField
        id={titleId}
        label="Title"
        className="mt-4"
        value={title}
        onChange={setTitle}
        onBlur={() => setTitleTouched(true)}
        error={titleError}
      />
      <TextAreaField
        id={`${id}-content`}
        label="Text"
        optional
        rows={5}
        maxLength={10000}
        value={content}
        onChange={setContent}
      />

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
        <button type="submit" disabled={busy} className={buttonClass("primary")}>
          {busy ? busyLabel : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className={buttonClass("secondary")}>
          Cancel
        </button>
      </div>
    </form>
  );
}
