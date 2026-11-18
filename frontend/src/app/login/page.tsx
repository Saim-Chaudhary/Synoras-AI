"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import AuthCard from "@/components/auth-card";
import TextField from "@/components/text-field";
import { ApiError } from "@/lib/api";
import { getToken, login } from "@/lib/auth";

// Turns what went wrong into a sentence for the person (SDD table 8.2.1).
function loginMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "Something went wrong. Please try again.";
  if (error.status === 401) return "Wrong email or password.";
  if (error.status === 423) {
    return "Too many wrong attempts. Login is locked for 15 minutes. Please try again later.";
  }
  if (error.status === 503) return `The server is not ready: ${error.message}`;
  if (error.status === 0) return error.message;
  return `Login failed (error ${error.status}). Please try again.`;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already logged in? Go straight to the dashboard (it checks the token is still good).
  useEffect(() => {
    if (getToken()) router.replace("/dashboard");
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = "Enter your email.";
    if (!password) errors.password = "Enter your password.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace("/dashboard");
    } catch (error) {
      setFormError(loginMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Log in to Synoras AI">
      <form onSubmit={handleSubmit} noValidate>
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
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
        />

        {formError && (
          <p role="alert" className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full cursor-pointer rounded-md bg-gray-700 px-4 py-3 font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Logging in..." : "Log In"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-sm text-gray-500">
        <div className="h-px flex-1 bg-gray-300" />
        or
        <div className="h-px flex-1 bg-gray-300" />
      </div>

      <Link
        href="/register"
        className="block w-full rounded-md border border-gray-600 bg-white px-4 py-3 text-center font-bold text-gray-800 hover:bg-gray-50"
      >
        Create an account
      </Link>
    </AuthCard>
  );
}
