// Class names for buttons and links that look like buttons, so every button looks the same.
// Use them like:  <button className={buttonClass("primary")}>  or  <Link className={buttonClass("secondary")}>
//
// All buttons are 40 px high with 10 px corners (the shape scale in globals.css).
//   primary   the main action of a screen (navy in light mode, amber in dark mode)
//   secondary a second action, with a visible edge
//   quiet     a small action inside a card or a row, no edge
//   danger    deleting something

type Variant = "primary" | "secondary" | "quiet" | "danger";

const BASE =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-control px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover",
  secondary: "border border-line-strong bg-raised text-ink hover:bg-surface-hover",
  quiet: "text-ink-muted hover:bg-surface-hover hover:text-ink",
  danger: "bg-danger text-canvas hover:opacity-90",
};

export function buttonClass(variant: Variant = "primary", extra = ""): string {
  return `${BASE} ${VARIANTS[variant]} ${extra}`.trim();
}
