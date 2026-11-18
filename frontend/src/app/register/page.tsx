"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import AuthCard from "@/components/auth-card";
import { buttonClass } from "@/components/button";
import TextField from "@/components/text-field";
import { ApiError } from "@/lib/api";
import { getToken, register } from "@/lib/auth";

type FieldErrors = { name?: string; email?: string; password?: string };

const MIN_PASSWORD_LENGTH = 8; // the backend enforces the same rule (SRS BR-10)

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getToken()) router.replace("/chat");
  }, [router]);

  // Show a server problem next to the input it belongs to (SDD table 8.2.1).
  function showServerError(error: unknown) {
    if (!(error instanceof ApiError)) {
      setFormError("Something went wrong. Please try again.");
      return;
    }
    if (error.status === 409) {
      setFieldErrors({ email: "This email is already registered. Try logging in instead." });
    } else if (error.status === 422 && error.message.toLowerCase().includes("too short")) {
      setFieldErrors({ password: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
    } else if (error.status === 422 && Object.keys(error.fields).length > 0) {
      setFieldErrors({
        name: error.fields.name,
        email: error.fields.email,
        password: error.fields.password,
      });
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

    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = "Enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = "Enter a valid email address.";
    if (password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return; // the other fields keep what was typed

    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password); // also logs you in
      router.replace("/chat");
    } catch (error) {
      setFieldErrors({});
      showServerError(error);
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Create your Synoras AI account">
      <form onSubmit={handleSubmit} noValidate>
        <TextField
          id="name"
          label="Name"
          autoComplete="name"
          value={name}
          onChange={setName}
          error={fieldErrors.name}
        />
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          error={fieldErrors.email}
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          error={fieldErrors.password}
        />

        {formError && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-danger-line bg-danger-soft px-3 py-2 text-sm text-danger"
          >
            {formError}
          </p>
        )}

        <button type="submit" disabled={submitting} className={buttonClass("primary", "mt-6 w-full")}>
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-sm text-ink-faint">
        <div className="h-px flex-1 bg-line" />
        or
        <div className="h-px flex-1 bg-line" />
      </div>

      <Link href="/login" className={buttonClass("secondary", "w-full")}>
        I already have an account
      </Link>
    </AuthCard>
  );
}
