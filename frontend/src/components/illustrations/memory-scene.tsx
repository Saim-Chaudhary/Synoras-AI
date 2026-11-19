import type { CSSProperties } from "react";
import { useId } from "react";

// The login picture: how Synoras remembers (decisions A29). Read from top to bottom:
//   Documents  ->  Memory (a knowledge graph)  ->  Confidence.
// Three documents feed a graph. Old memories are fainter than fresh ones, one fact conflicts with
// another (the AI asks you instead of overwriting it), and one old memory has dropped to 41%.
// Original drawing, all colors from theme tokens (it sits on the dark brand panel), decorative.
// The staged fade-in and the moving lights are CSS (globals.css, section 7) and stop under
// prefers-reduced-motion, so the finished picture is shown still.

type Props = {
  compact?: boolean; // the small version for the phone header: no side labels
  className?: string;
};

const stage = (n: number): CSSProperties => ({ ["--stage" as string]: n });
const travel = (d: string, seconds: number, delay: number): CSSProperties => ({
  offsetPath: `path("${d}")`,
  ["--travel" as string]: `${seconds}s`,
  ["--travel-delay" as string]: `${delay}s`,
});

// Memory nodes: x, y, how old it is (1 = fresh, lower = older and fainter).
const OLD_NODES = [
  { x: 150, y: 268, o: 0.6 },
  { x: 118, y: 232, o: 0.28 },
  { x: 352, y: 262, o: 0.45 },
  { x: 205, y: 338, o: 0.5 },
  { x: 300, y: 372, o: 0.34 },
  { x: 372, y: 318, o: 0.26 },
];
const FRESH_NODES = [
  { x: 192, y: 214 },
  { x: 292, y: 222 },
  { x: 278, y: 306 },
];

const CARDS = [130, 206, 282];
const RETRIEVAL = "M205 338 Q214 292 240 262 Q270 238 292 222";
const CONFLICT = "M352 262 Q372 300 340 318";

export default function MemoryScene({ compact = false, className }: Props) {
  const uid = useId().replace(/:/g, "");
  const grid = `grid-${uid}`;
  const fade = `fade-${uid}`;
  const mask = `mask-${uid}`;

  return (
    <svg
      viewBox={compact ? "96 0 304 540" : "0 0 400 540"}
      role="img"
      aria-label="Documents feed a knowledge graph. Older memories fade, fresh ones glow, and a conflict is flagged instead of overwritten."
      className={className}
      fill="none"
    >
      <defs>
        <pattern id={grid} width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" className="fill-on-panel" />
        </pattern>
        <radialGradient id={fade} cx="50%" cy="48%" r="62%">
          <stop offset="0.35" stopColor="white" />
          <stop offset="1" stopColor="black" />
        </radialGradient>
        <mask id={mask}>
          <rect width="400" height="540" fill={`url(#${fade})`} />
        </mask>
      </defs>

      {/* dot grid that fades toward the edges */}
      <rect width="400" height="540" fill={`url(#${grid})`} opacity="0.16" mask={`url(#${mask})`} />

      {/* stage labels */}
      {!compact && (
        <g className="fill-on-panel/75 text-[15.5px] font-medium">
          <text x="4" y="50">Documents</text>
          <text x="4" y="258">Memory</text>
          <text x="4" y="392">Confidence</text>
        </g>
      )}

      {/* stage 0: three document cards */}
      <g className="scene-stage" style={stage(0)}>
        {CARDS.map((x) => (
          <g key={x}>
            <rect x={x} y="14" width="52" height="60" rx="7" className="fill-on-panel/10 stroke-on-panel/45" strokeWidth="1.2" />
            <path d={`M${x + 10} 30h32M${x + 10} 41h32M${x + 10} 52h20`} className="stroke-on-panel/55" strokeWidth="2" strokeLinecap="round" />
          </g>
        ))}
      </g>

      {/* stage 1: lines flow from the documents into the graph */}
      <g className="scene-stage" style={stage(1)}>
        {CARDS.map((x, i) => {
          const d = `M${x + 26} 76 C${x + 26} 150 240 170 240 252`;
          return (
            <g key={x}>
              <path d={d} className="scene-flow stroke-panel-teal/70" strokeWidth="1.6" strokeLinecap="round" />
              <circle r="3" className="scene-travel fill-panel-teal" style={travel(d, 3.6, i * 1.1)} />
            </g>
          );
        })}
      </g>

      {/* stage 2: the knowledge graph */}
      <g className="scene-stage" style={stage(2)}>
        <circle cx="240" cy="262" r="62" className="stroke-on-panel/25" strokeWidth="1" strokeDasharray="2 6" />
        <circle cx="240" cy="262" r="118" className="stroke-on-panel/15" strokeWidth="1" strokeDasharray="2 8" />

        {/* curved edges: fainter toward older nodes */}
        <g strokeLinecap="round" strokeWidth="1.3">
          <path d="M240 262 Q215 232 192 214" className="stroke-panel-teal/80" />
          <path d="M240 262 Q272 244 292 222" className="stroke-panel-teal/80" />
          <path d="M240 262 Q268 292 278 306" className="stroke-panel-teal/80" />
          <path d="M240 262 Q192 250 150 268" className="stroke-on-panel/40" />
          <path d="M240 262 Q216 306 205 338" className="stroke-on-panel/35" />
          <path d="M240 262 Q310 246 352 262" className="stroke-on-panel/25" />
          <path d="M150 268 Q128 244 118 232" className="stroke-on-panel/20" />
          <path d="M278 306 Q290 342 300 372" className="stroke-on-panel/25" />
          <path d="M278 306 Q330 300 372 318" className="stroke-on-panel/20" />
        </g>

        {/* the highlighted retrieval path, with a light moving along it */}
        <path d={RETRIEVAL} className="stroke-panel-teal" strokeWidth="2.6" strokeLinecap="round" />
        <circle r="4" className="scene-travel fill-on-panel" style={travel(RETRIEVAL, 3.2, 0.4)} />

        {OLD_NODES.map((n) => (
          <circle key={`${n.x}-${n.y}`} cx={n.x} cy={n.y} r="5" className="fill-on-panel" opacity={n.o} />
        ))}
        {FRESH_NODES.map((n) => (
          <g key={`${n.x}-${n.y}`}>
            <circle cx={n.x} cy={n.y} r="11" className="stroke-panel-teal/60" strokeWidth="1" />
            <circle cx={n.x} cy={n.y} r="5.5" className="fill-panel-teal" />
          </g>
        ))}

        {/* the coral center point with a ripple */}
        <circle cx="240" cy="262" r="10" className="scene-ripple stroke-panel-live" strokeWidth="1.5" />
        <circle cx="240" cy="262" r="10" className="fill-panel-live" />
      </g>

      {/* stage 3: a conflict, and a memory that has faded to 41% */}
      <g className="scene-stage" style={stage(3)}>
        <path d={CONFLICT} className="stroke-panel-live" strokeWidth="1.6" strokeDasharray="4 4" strokeLinecap="round" />
        <circle cx="366" cy="290" r="10" className="fill-panel stroke-panel-live" strokeWidth="1.5" />
        <text x="366" y="295" textAnchor="middle" className="fill-panel-live text-[14px] font-semibold">?</text>
        {!compact && (
          <text x="372" y="338" textAnchor="middle" className="fill-panel-live text-[14px]">conflict</text>
        )}

        <circle cx="160" cy="392" r="12" className="stroke-on-panel/55" strokeWidth="1.2" strokeDasharray="3 3" />
        <circle cx="160" cy="392" r="5" className="fill-on-panel" opacity="0.3" />
        {!compact && (
          <text x="180" y="397" className="fill-on-panel/80 text-[15.5px] font-medium">41%</text>
        )}
      </g>

      {/* stage 4: legend, Fresh to Faded */}
      <g className="scene-stage" style={stage(4)}>
        {[1, 0.78, 0.58, 0.4, 0.26, 0.14].map((o, i) => (
          <circle key={i} cx={158 + i * 20} cy="500" r="4.5" className="fill-on-panel" opacity={o} />
        ))}
        {!compact && (
          <g className="fill-on-panel/75 text-[14.5px]">
            <text x="146" y="505" textAnchor="end">Fresh</text>
            <text x="270" y="505">Faded</text>
          </g>
        )}
      </g>
    </svg>
  );
}
