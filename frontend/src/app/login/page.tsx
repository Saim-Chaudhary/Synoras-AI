"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import AuthCard from "@/components/auth-card";
import { buttonClass } from "@/components/button";
import { AlertIcon, LockIcon, MailIcon } from "@/components/icons";
import TextField from "@/components/text-field";
import { ApiError } from "@/lib/api";
import { getToken, login } from "@/lib/auth";
import { checkEmail, checkPasswordPresent, focusFirstInvalid, focusOnComputers } from "@/lib/validation";

// Turns what went wrong into a sentence for the person, saying what to do next (SDD table 8.2.1).
function loginMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "Something went wrong. Please try again.";
  if (error.status === 401) return "Wrong email or password. Check them and try again.";
  if (error.status === 423) {
    return "Too many wrong attempts, so login is locked for 15 minutes. Please try again then.";
  }
  if (error.status === 503) return `The server is not ready: ${error.message}`;
  if (error.status === 0) return error.message;
  return `Login failed (error ${error.status}). Please try again.`;
}

type Field = "email" | "password";
const FIELDS: Field[] = ["email", "password"];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // A field is checked when the person LEAVES it (or presses Log in), not while typing the
  // first time. After that it is re-checked on every key, so the message goes away as soon as
  // the mistake is fixed.
  const [touched, setTouched] = useState<Record<Field, boolean>>({ email: false, password: false });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const errors: Record<Field, string | undefined> = {
    email: touched.email ? checkEmail(email) : undefined,
    password: touched.password ? checkPasswordPresent(password) : undefined,
  };

  // Already logged in? Go straight to the chat (it checks the token is still good).
  useEffect(() => {
    if (getToken()) router.replace("/chat");
    else focusOnComputers("email");
  }, [router]);

  // Editing a field clears its error and the server's message. An error shows again only when the
  // person leaves the field or presses Log in (decisions A29).
  function edit(field: Field, setValue: (value: string) => void) {
    return (value: string) => {
      setValue(value);
      setTouched((current) => ({ ...current, [field]: false }));
      setFormError(null);
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const found = { email: checkEmail(email), password: checkPasswordPresent(password) };
    setTouched({ email: true, password: true });
    if (found.email || found.password) {
      focusFirstInvalid(FIELDS, found);
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace("/chat");
    } catch (error) {
      setFormError(loginMessage(error));
      setSubmitting(false);
      // After a wrong password the cursor goes back to the password with its text selected, so
      // typing replaces it (clearing it would also trigger "Enter your password" next to the error).
      if (error instanceof ApiError && error.status === 401) {
        const field = document.getElementById("password") as HTMLInputElement | null;
        field?.focus();
        field?.select();
      }
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to continue your conversations."
      switchPrompt="New to Synoras?"
      switchLabel="Create an account"
      switchHref="/register"
      art="memory"
    >
      <form onSubmit={handleSubmit} noValidate>
        <TextField
          id="email"
          label="Email"
          type="email"
          inputMode="email"
          icon={<MailIcon className="size-5" />}
          className="mt-0"
          autoComplete="email"
          value={email}
          onChange={edit("email", setEmail)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          error={errors.email}
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          icon={<LockIcon className="size-5" />}
          labelAction={
            <Link
              href="/forgot-password"
              className="inline-flex min-h-10 items-center text-sm font-medium text-accent underline underline-offset-4 hover:text-accent-hover"
            >
              Forgot password?
            </Link>
          }
          autoComplete="current-password"
          value={password}
          onChange={edit("password", setPassword)}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          error={errors.password}
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

        <button type="submit" disabled={submitting} className={buttonClass("primary", "mt-6 w-full !min-h-12 text-base")}>
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>
    </AuthCard>
  );
}
