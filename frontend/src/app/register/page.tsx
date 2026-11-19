"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import AuthCard from "@/components/auth-card";
import { buttonClass } from "@/components/button";
import { AlertIcon, LockIcon, MailIcon, UserIcon } from "@/components/icons";
import TextField from "@/components/text-field";
import { ApiError } from "@/lib/api";
import { getToken, register } from "@/lib/auth";
import {
  MIN_PASSWORD_LENGTH,
  checkEmail,
  checkName,
  checkNewPassword,
  focusFirstInvalid,
  focusOnComputers,
} from "@/lib/validation";

type Field = "name" | "email" | "password";
const FIELDS: Field[] = ["name", "email", "password"];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Same rule as the login page: a field is checked when the person leaves it, then live.
  const [touched, setTouched] = useState<Record<Field, boolean>>({ name: false, email: false, password: false });
  // Problems only the server can find (for example "this email is already registered").
  // They disappear as soon as the person edits that field.
  const [serverErrors, setServerErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const errors: Record<Field, string | undefined> = {
    name: serverErrors.name ?? (touched.name ? checkName(name) : undefined),
    email: serverErrors.email ?? (touched.email ? checkEmail(email) : undefined),
    // The password rule is also shown as a checklist under the field, so it is only repeated
    // as an error after the person has left the field or pressed the button.
    password: serverErrors.password ?? (touched.password ? checkNewPassword(password) : undefined),
  };

  useEffect(() => {
    if (getToken()) router.replace("/chat");
    else focusOnComputers("name");
  }, [router]);

  // Editing a field clears every complaint about it (ours and the server's): an error shows
  // again only when the person leaves the field or presses the button (decisions A29).
  function edit(field: Field, setValue: (value: string) => void) {
    return (value: string) => {
      setValue(value);
      setTouched((current) => ({ ...current, [field]: false }));
      setServerErrors((current) => ({ ...current, [field]: undefined }));
      setFormError(null);
    };
  }

  // Show a server problem next to the input it belongs to (SDD table 8.2.1).
  function showServerError(error: unknown) {
    if (!(error instanceof ApiError)) {
      setFormError("Something went wrong. Please try again.");
      return;
    }
    if (error.status === 409) {
      setServerErrors({ email: "This email is already registered. Try logging in instead." });
      document.getElementById("email")?.focus();
    } else if (error.status === 422 && error.message.toLowerCase().includes("too short")) {
      setServerErrors({ password: `Use at least ${MIN_PASSWORD_LENGTH} characters.` });
      document.getElementById("password")?.focus();
    } else if (error.status === 422 && Object.keys(error.fields).length > 0) {
      setServerErrors({ name: error.fields.name, email: error.fields.email, password: error.fields.password });
    } else if (error.status === 503) {
      setFormError(`The server is not ready: ${error.message}`);
    } else if (error.status === 0) {
      setFormError(error.message);
    } else {
      setFormError(`Registration failed (error ${error.status}). Please try again.`);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const found = { name: checkName(name), email: checkEmail(email), password: checkNewPassword(password) };
    setTouched({ name: true, email: true, password: true });
    if (found.name || found.email || found.password) {
      focusFirstInvalid(FIELDS, found); // the other fields keep what was typed
      return;
    }

    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password); // also logs you in
      router.replace("/chat");
    } catch (error) {
      setServerErrors({});
      showServerError(error);
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="It takes a minute. No card needed."
      switchPrompt="Already have an account?"
      switchLabel="Log in"
      switchHref="/login"
      art="routing"
    >
      <form onSubmit={handleSubmit} noValidate>
        <TextField
          id="name"
          label="Name"
          icon={<UserIcon className="size-5" />}
          className="mt-0"
          autoComplete="name"
          value={name}
          onChange={edit("name", setName)}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          error={errors.name}
        />
        <TextField
          id="email"
          label="Email"
          type="email"
          inputMode="email"
          icon={<MailIcon className="size-5" />}
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
          autoComplete="new-password"
          value={password}
          onChange={edit("password", setPassword)}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          requirements={[{ label: `At least ${MIN_PASSWORD_LENGTH} characters`, met: password.length >= MIN_PASSWORD_LENGTH }]}
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
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthCard>
  );
}
