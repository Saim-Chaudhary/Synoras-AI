"use client";

import { useState, type KeyboardEvent } from "react";

import { AlertIcon, CheckIcon, EyeIcon, EyeOffIcon } from "@/components/icons";

// One form field: a label above, the input, and what the person needs to know about it.
//
// Rules from human-computer interaction that this component follows (decisions A26):
//  * The label is always visible (never only a placeholder), so nothing has to be remembered.
//  * Help is shown BEFORE the mistake (hint, or a requirements list), not only after it.
//  * An error says what is wrong and how to fix it, next to the field, with an icon AND text
//    (never color alone), and the input is marked invalid for screen readers.
//  * A password can be shown, so a typing mistake is visible and no second "confirm" box is needed.
//  * Caps Lock is announced, because it is the most common silent cause of a wrong password.

export type Requirement = { label: string; met: boolean };

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void; // the page validates the field when the person leaves it
  type?: "text" | "email" | "password";
  autoComplete?: string; // lets the browser and password managers fill the field in
  inputMode?: "text" | "email";
  hint?: string; // small help text under the input
  requirements?: Requirement[]; // a checklist, for example for the password rules
  error?: string; // when set, the input is marked wrong and the message appears below it
};

export default function TextField({
  id,
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  autoComplete,
  inputMode,
  hint,
  requirements,
  error,
}: Props) {
  const [shown, setShown] = useState(false); // password visible?
  const [capsLock, setCapsLock] = useState(false);
  const isPassword = type === "password";
  const describedBy = [error ? `${id}-error` : null, hint && !error ? `${id}-hint` : null, requirements ? `${id}-rules` : null]
    .filter(Boolean)
    .join(" ");

  function checkCapsLock(event: KeyboardEvent<HTMLInputElement>) {
    if (isPassword && typeof event.getModifierState === "function") {
      setCapsLock(event.getModifierState("CapsLock"));
    }
  }

  return (
    <div className="mt-5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          name={id}
          type={isPassword && shown ? "text" : type}
          value={value}
          autoComplete={autoComplete}
          inputMode={inputMode}
          autoCapitalize={type === "text" ? undefined : "none"}
          spellCheck={type === "text" ? undefined : false}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => {
            setCapsLock(false);
            onBlur?.();
          }}
          onKeyDown={checkCapsLock}
          onKeyUp={checkCapsLock}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={`block h-12 w-full rounded-control border bg-surface px-3 text-base text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-live/40 ${
            isPassword ? "pr-12" : ""
          } ${error ? "border-danger" : "border-line-strong"}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShown(!shown)}
            aria-label={shown ? "Hide password" : "Show password"}
            aria-pressed={shown}
            title={shown ? "Hide password" : "Show password"}
            className="absolute right-1 top-1 inline-flex size-10 items-center justify-center rounded-control text-ink-muted hover:bg-surface-hover hover:text-ink"
          >
            {shown ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>

      {capsLock && (
        <p role="status" className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-muted">
          <AlertIcon className="size-4 shrink-0" />
          Caps Lock is on.
        </p>
      )}

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
      {requirements && (
        <ul id={`${id}-rules`} className="mt-2 space-y-1 text-sm">
          {requirements.map((rule) => (
            <li key={rule.label} className={`flex items-center gap-1.5 ${rule.met ? "text-ink" : "text-ink-muted"}`}>
              {rule.met ? (
                <CheckIcon className="size-4 shrink-0 text-accent" />
              ) : (
                <span aria-hidden="true" className="ml-1.5 mr-1 size-1.5 shrink-0 rounded-full bg-ink-faint" />
              )}
              <span>
                {rule.label}
                <span className="sr-only">{rule.met ? " (done)" : " (not yet)"}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
