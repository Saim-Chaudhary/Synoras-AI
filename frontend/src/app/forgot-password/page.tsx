import AuthCard from "@/components/auth-card";

// A placeholder for the "Forgot password?" link on the login page. Version 1.0 has no email
// service, so a password cannot be reset yet (see docs/progress.md: password reset is an optional
// later feature). The page says so plainly instead of leaving the link dead.
export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      subtitle="Password reset is not available yet."
      switchPrompt="Remembered it?"
      switchLabel="Back to log in"
      switchHref="/login"
      art="memory"
    >
      <p className="text-base leading-6 text-ink-muted">
        This version of Synoras AI has no email service, so it cannot send a reset link. If you cannot log in, create a
        new account with a different email address.
      </p>
    </AuthCard>
  );
}
