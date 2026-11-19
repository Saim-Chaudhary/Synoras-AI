import type { Progress } from "@/lib/projects";

// "3 of 8 tasks done" with a bar. The words carry the meaning; the bar only shows it
// (so nothing depends on color alone).
export function progressText(progress: Progress): string {
  if (progress.total === 0) return "No tasks yet";
  return `${progress.done} of ${progress.total} ${progress.total === 1 ? "task" : "tasks"} done · ${progress.percent_done}%`;
}

export default function ProgressBar({ progress, showText = true }: { progress: Progress; showText?: boolean }) {
  return (
    <div>
      <div
        role="progressbar"
        aria-label="Tasks done"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percent_done}
        aria-valuetext={progressText(progress)}
        className="h-2 overflow-hidden rounded-full bg-line"
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${progress.percent_done}%` }} />
      </div>
      {showText && <p className="mt-1.5 text-xs text-ink-muted">{progressText(progress)}</p>}
    </div>
  );
}
