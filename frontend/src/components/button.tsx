// Class names for buttons and links that look like buttons, so every button looks the same.
// Use them like:  <button className={buttonClass("primary")}>  or  <Link className={buttonClass("secondary")}>

type Variant = "primary" | "secondary";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-medium disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover",
  secondary: "border border-line bg-surface text-ink hover:bg-surface-hover",
};

export function buttonClass(variant: Variant = "primary", extra = ""): string {
  return `${BASE} ${VARIANTS[variant]} ${extra}`.trim();
}
