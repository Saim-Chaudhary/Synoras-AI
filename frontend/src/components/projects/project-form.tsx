"use client";

// The form to create or edit a project: a name and an optional description (FR-11).
// Same rules as the other forms (decisions A26): labels above the fields, a field is checked
// when the person leaves it, errors have an icon and text, and the cursor goes to the first
// wrong field. The server's "this name is already used" appears next to the name.

import { useEffect, useState, type FormEvent } from "react";

import { buttonClass } from "@/components/button";
import { AlertIcon } from "@/components/icons";
import TextAreaField from "@/components/textarea-field";
import TextField from "@/components/text-field";
import { checkTitle } from "@/lib/validation";

type Props = {
  initialTitle?: string;
  initialDescription?: string;
  submitLabel: string;
  busyLabel: string;
  // Returns null when it worked, or what went wrong (field "title" for a name problem).
  onSubmit: (title: string, description: string) => Promise<{ field: "title" | "form"; message: string } | null>;
  onCancel?: () => void;
  autoFocus?: boolean;
};

export default function ProjectForm({
  initialTitle = "",
  initialDescription = "",
  submitLabel,
  busyLabel,
  onSubmit,
  onCancel,
  autoFocus,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [titleTouched, setTitleTouched] = useState(false);
  const [serverTitleError, setServerTitleError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (autoFocus && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      document.getElementById("project-title")?.focus();
    }
  }, [autoFocus]);

  const titleError = serverTitleError ?? (titleTouched ? checkTitle(title, "project name") : undefined);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setTitleTouched(true);
    if (checkTitle(title, "project name")) {
      document.getElementById("project-title")?.focus();
      return;
    }
    setBusy(true);
    const problem = await onSubmit(title.trim(), description.trim());
    setBusy(false);
    if (!problem) return;
    if (problem.field === "title") {
      setServerTitleError(problem.message);
      document.getElementById("project-title")?.focus();
    } else {
      setFormError(problem.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <TextField
        id="project-title"
        label="Project name"
        className="mt-0"
        value={title}
        onChange={(value) => {
          setTitle(value);
          setServerTitleError(undefined);
        }}
        onBlur={() => setTitleTouched(true)}
        error={titleError}
      />
      <TextAreaField
        id="project-description"
        label="Description"
        optional
        rows={4}
        maxLength={2000}
        value={description}
        onChange={setDescription}
        hint="A few words about the goal. The assistant reads this in every chat of the project."
        className="mt-5"
      />

      {formError && (
        <p
          role="alert"
          className="mt-5 flex items-start gap-2 rounded-control border border-danger-line bg-danger-soft px-3 py-2.5 text-sm text-danger"
        >
          <AlertIcon className="mt-0.5 size-4 shrink-0" />
          {formError}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className={buttonClass("primary")}>
          {busy ? busyLabel : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={buttonClass("secondary")}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
