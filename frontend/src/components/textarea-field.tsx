"use client";

// A label, a multi-line input and what the person needs to know about it. It looks and behaves
// like TextField (same label above, same edge, same error style: decisions A26), for longer text
// such as a project description or a note.

import { AlertIcon } from "@/components/icons";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  rows?: number;
  maxLength?: number;
  hint?: string;
  error?: string;
  optional?: boolean; // adds "(optional)" to the label
  className?: string;
};

export default function TextAreaField({
  id,
  label,
  value,
  onChange,
  onBlur,
  rows = 3,
  maxLength,
  hint,
  error,
  optional,
  className = "mt-4",
}: Props) {
  const describedBy = [error ? `${id}-error` : null, hint && !error ? `${id}-hint` : null].filter(Boolean).join(" ");
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {optional && <span className="font-normal text-ink-muted"> (optional)</span>}
      </label>
      <textarea
        id={id}
        name={id}
        rows={rows}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`mt-1.5 block w-full resize-y rounded-control border bg-surface px-3 py-2.5 text-base leading-6 text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-live/40 ${
          error ? "border-danger" : "border-line-strong"
        }`}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm text-danger">
          <AlertIcon className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
