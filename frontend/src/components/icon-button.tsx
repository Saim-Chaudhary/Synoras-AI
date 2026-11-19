import type { ReactNode } from "react";

// A square button that holds only an icon (40 px, so it is easy to hit on a phone).
// "label" is read aloud by screen readers and shown as a tooltip, so every icon button says
// what it does.
type Props = {
  label: string;
  onClick: () => void;
  pressed?: boolean; // for buttons that switch something on and off
  expanded?: boolean; // for buttons that open a menu or a drawer
  children: ReactNode;
};

export const ICON_BUTTON_CLASS =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-control text-ink-muted hover:bg-surface-hover hover:text-ink";

export default function IconButton({ label, onClick, pressed, expanded, children }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      aria-expanded={expanded}
      onClick={onClick}
      className={ICON_BUTTON_CLASS}
    >
      {children}
    </button>
  );
}
