import Logo from "@/components/logo";
import { buttonClass } from "@/components/button";

// A full-page message for the two moments when there is nothing else to show:
// while the page checks the login, and when that check fails.
type Props =
  | { kind: "loading" }
  | { kind: "error"; message: string; onRetry: () => void };

export default function StatusScreen(props: Props) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
      <Logo variant="mark" height={40} priority />
      {props.kind === "loading" ? (
        <p role="status" className="text-ink-muted">
          Loading...
        </p>
      ) : (
        <>
          <p
            role="alert"
            className="max-w-md rounded-xl border border-danger-line bg-danger-soft px-4 py-3 text-danger"
          >
            {props.message}
          </p>
          <button type="button" onClick={props.onRetry} className={buttonClass("secondary")}>
            Try again
          </button>
        </>
      )}
    </main>
  );
}
