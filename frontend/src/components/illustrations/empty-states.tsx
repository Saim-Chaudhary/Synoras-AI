import type { ReactNode } from "react";

// Small flat pictures for empty screens and the error pages (decisions A29). They share one
// language with the login and register scenes: the logo's dots and lines, and one coral point.
// Original drawings, theme tokens only (they follow light and dark), still (no motion), decorative.

type Props = { className?: string };

function Frame({ children, className = "h-28 w-auto" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" aria-hidden="true" className={className}>
      {children}
    </svg>
  );
}

// The coral point: the one live thing in each picture.
const Live = ({ x, y, r = 5 }: { x: number; y: number; r?: number }) => (
  <circle cx={x} cy={y} r={r} className="fill-live" />
);

// An empty chat: two message bubbles, the second one answered.
export function EmptyChatArt({ className }: Props) {
  return (
    <Frame className={className}>
      <rect x="18" y="20" width="84" height="36" rx="14" className="fill-raised stroke-line-strong" strokeWidth="1.5" />
      <path d="M32 34h48M32 44h30" className="stroke-ink-faint" strokeWidth="3" strokeLinecap="round" />
      <rect x="58" y="66" width="84" height="36" rx="14" className="fill-accent-soft stroke-accent" strokeWidth="1.5" />
      <path d="M72 80h52M72 90h28" className="stroke-accent" strokeWidth="3" strokeLinecap="round" />
      <Live x={138} y={66} />
      <circle cx="136" cy="26" r="2.5" className="fill-accent" opacity="0.5" />
      <circle cx="146" cy="40" r="2" className="fill-accent" opacity="0.3" />
    </Frame>
  );
}

// No projects: a folder with a few connected dots inside.
export function NoProjectsArt({ className }: Props) {
  return (
    <Frame className={className}>
      <path
        d="M22 36a8 8 0 0 1 8-8h26l10 10h54a8 8 0 0 1 8 8v46a8 8 0 0 1-8 8H30a8 8 0 0 1-8-8z"
        className="fill-raised stroke-line-strong"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M56 70 80 56l28 18" className="stroke-accent" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="56" cy="70" r="5" className="fill-accent" />
      <circle cx="108" cy="74" r="5" className="fill-accent" opacity="0.55" />
      <Live x={80} y={56} />
    </Frame>
  );
}

// No tasks: an empty three-column board with one card slot.
export function NoTasksArt({ className }: Props) {
  return (
    <Frame className={className}>
      {[16, 60, 104].map((x) => (
        <rect key={x} x={x} y="22" width="40" height="76" rx="8" className="fill-raised stroke-line" strokeWidth="1.5" />
      ))}
      <rect x="22" y="32" width="28" height="18" rx="5" className="fill-accent-soft stroke-accent" strokeWidth="1.5" strokeDasharray="3 3" />
      <path d="M66 36h22M66 44h14M110 36h22" className="stroke-ink-faint" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      <Live x={36} y={41} r={3.5} />
    </Frame>
  );
}

// No memories yet: dots that will become memories, with one live point in the middle.
export function NoMemoriesArt({ className }: Props) {
  return (
    <Frame className={className}>
      <circle cx="80" cy="60" r="26" className="stroke-line-strong" strokeWidth="1.2" strokeDasharray="2 5" />
      <circle cx="80" cy="60" r="48" className="stroke-line" strokeWidth="1.2" strokeDasharray="2 6" />
      <circle cx="50" cy="40" r="4" className="fill-accent" opacity="0.55" />
      <circle cx="112" cy="46" r="4" className="fill-accent" opacity="0.35" />
      <circle cx="106" cy="84" r="4" className="fill-accent" opacity="0.2" />
      <circle cx="54" cy="82" r="4" className="fill-accent" opacity="0.2" />
      <path d="M80 60 50 40M80 60l32-14" className="stroke-accent" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
      <Live x={80} y={60} r={6} />
    </Frame>
  );
}

// An empty knowledge graph: separate nodes waiting for documents, edges that stop short.
export function EmptyGraphArt({ className }: Props) {
  return (
    <Frame className={className}>
      <path d="M40 80q16-30 40-26" className="stroke-line-strong" strokeWidth="1.4" strokeDasharray="3 4" strokeLinecap="round" />
      <path d="M80 54q26-12 42 8" className="stroke-line-strong" strokeWidth="1.4" strokeDasharray="3 4" strokeLinecap="round" />
      <circle cx="40" cy="80" r="6" className="fill-raised stroke-accent" strokeWidth="1.6" />
      <circle cx="122" cy="62" r="6" className="fill-raised stroke-accent" strokeWidth="1.6" />
      <circle cx="60" cy="28" r="4" className="fill-accent" opacity="0.4" />
      <circle cx="108" cy="96" r="4" className="fill-accent" opacity="0.3" />
      <Live x={80} y={54} r={6} />
    </Frame>
  );
}

// 404: a trail of dots that ends in a gap, and a coral point where the page should be.
export function NotFoundArt({ className }: Props) {
  return (
    <Frame className={className}>
      <path d="M18 84q22-40 48-24t38-16" className="stroke-line-strong" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 7" />
      <circle cx="18" cy="84" r="4.5" className="fill-accent" />
      <circle cx="66" cy="60" r="4.5" className="fill-accent" opacity="0.7" />
      <circle cx="104" cy="44" r="4.5" className="fill-accent" opacity="0.45" />
      <circle cx="136" cy="34" r="12" className="stroke-live" strokeWidth="1.6" strokeDasharray="3 3" />
      <Live x={136} y={34} r={4} />
    </Frame>
  );
}

// An error: a graph with one broken edge, and a coral mark at the break.
export function ErrorArt({ className }: Props) {
  return (
    <Frame className={className}>
      <path d="M26 82 56 50" className="stroke-accent" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M72 38 100 30M100 30l30 28" className="stroke-accent" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="26" cy="82" r="5.5" className="fill-accent" />
      <circle cx="100" cy="30" r="5.5" className="fill-accent" opacity="0.6" />
      <circle cx="130" cy="58" r="5.5" className="fill-accent" opacity="0.4" />
      <path d="M58 54l10-14" className="stroke-live" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="2 4" />
      <path d="M58 30l16 16M74 30 58 46" className="stroke-live" strokeWidth="2.2" strokeLinecap="round" transform="translate(-2 2)" />
      <path d="M28 104h104" className="stroke-line" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2 6" />
    </Frame>
  );
}
