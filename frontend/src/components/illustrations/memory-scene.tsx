import type { CSSProperties } from "react";
import { useId } from "react";

// The login picture: how Synoras remembers (decisions A29). Read from top to bottom:
//   Documents  ->  Memory (a knowledge graph)  ->  Confidence.
// Three documents feed a graph. Old memories are fainter than fresh ones. The highlighted path is
// a memory being used: it ends on a fresh node. One fresh fact conflicts with an older one (the AI
// asks you instead of overwriting it), and one faded node is tagged 41%: how sure the AI still is.
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

const W = 480;
const H = 396;
const CX = 300; // the coral center point of the graph
const CY = 190;

// Memory nodes: x, y, how old it is (1 = fresh, lower = older and fainter).
const OLD_NODES = [
  { x: 205, y: 200, o: 0.75 },
  { x: 170, y: 150, o: 0.45 },
  { x: 415, y: 215, o: 0.62 }, // the older side of the conflict
  { x: 260, y: 265, o: 0.7 },
  { x: 400, y: 305, o: 0.4 },
  { x: 345, y: 322, o: 0.35 },
];
// The faded node that carries the 41% tag.
const FADED = { x: 250, y: 312 };
const FRESH_NODES = [
  { x: 240, y: 140 }, // the retrieval path ends here
  { x: 365, y: 135 },
  { x: 345, y: 245 }, // the fresh side of the conflict
];

const CARDS = [164, 274, 384]; // left edges of the three document cards (each 52 wide)
const RETRIEVAL = "M260 265 Q268 225 300 190 Q272 162 240 140";
const CONFLICT = "M345 245 Q385 250 415 215";

export default function MemoryScene({ compact = false, className }: Props) {
  const uid = useId().replace(/:/g, "");
  const grid = `grid-${uid}`;
  const fade = `fade-${uid}`;
  const mask = `mask-${uid}`;

  return (
    <svg
      viewBox={compact ? `100 0 ${W - 100} ${H}` : `0 0 ${W} ${H}`}
      preserveAspectRatio={compact ? "xMidYMid meet" : "xMinYMid meet"}
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
          <rect width={W} height={H} fill={`url(#${fade})`} />
        </mask>
      </defs>

      {/* dot grid that fades toward the edges */}
      <rect width={W} height={H} fill={`url(#${grid})`} opacity="0.2" mask={`url(#${mask})`} />

      {/* stage labels, each on the same row as what it names */}
      {!compact && (
        <g className="fill-on-panel text-[15.5px] font-medium">
          <text x="4" y="49">Documents</text>
          <text x="4" y="195">Memory</text>
          <text x="4" y="317">Confidence</text>
        </g>
      )}

      {/* stage 0: three document cards, spread across the width */}
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
          const d = `M${x + 26} 76 C${x + 26} 120 ${CX} 130 ${CX} ${CY - 12}`;
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
        <circle cx={CX} cy={CY} r="70" className="stroke-on-panel/25" strokeWidth="1" strokeDasharray="2 6" />
        <circle cx={CX} cy={CY} r="125" className="stroke-on-panel/15" strokeWidth="1" strokeDasharray="2 8" />

        {/* curved edges: fainter toward older nodes */}
        <g strokeLinecap="round" strokeWidth="1.3">
          <path d={`M${CX} ${CY} Q265 160 240 140`} className="stroke-panel-teal/80" />
          <path d={`M${CX} ${CY} Q335 150 365 135`} className="stroke-panel-teal/80" />
          <path d={`M${CX} ${CY} Q335 215 345 245`} className="stroke-panel-teal/80" />
          <path d={`M${CX} ${CY} Q250 175 205 200`} className="stroke-on-panel/40" />
          <path d={`M${CX} ${CY} Q275 225 260 265`} className="stroke-on-panel/35" />
          <path d={`M${CX} ${CY} Q365 180 415 215`} className="stroke-on-panel/25" />
          <path d="M205 200 Q185 170 170 150" className="stroke-on-panel/20" />
          <path d="M260 265 Q248 290 250 312" className="stroke-on-panel/30" />
          <path d="M345 245 Q350 290 345 322" className="stroke-on-panel/25" />
          <path d="M415 215 Q420 260 400 305" className="stroke-on-panel/20" />
        </g>

        {/* the highlighted retrieval path (it ends on a fresh node), with a light moving along it */}
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
        <circle cx={CX} cy={CY} r="10" className="scene-ripple stroke-panel-live" strokeWidth="1.5" />
        <circle cx={CX} cy={CY} r="10" className="fill-panel-live" />
      </g>

      {/* stage 3: a conflict between a fresh and an older memory, and a faded node at 41% */}
      <g className="scene-stage" style={stage(3)}>
        <path d={CONFLICT} className="stroke-panel-live" strokeWidth="1.6" strokeDasharray="4 4" strokeLinecap="round" />
        <circle cx="383" cy="241" r="10" className="fill-panel stroke-panel-live" strokeWidth="1.5" />
        <text x="383" y="246" textAnchor="middle" className="fill-panel-live text-[14px] font-semibold">?</text>
        {!compact && (
          <text x="390" y="272" textAnchor="middle" className="fill-panel-live text-[14px]">conflict</text>
        )}

        <circle cx={FADED.x} cy={FADED.y} r="12" className="stroke-on-panel/55" strokeWidth="1.2" strokeDasharray="3 3" />
        <circle cx={FADED.x} cy={FADED.y} r="5" className="fill-on-panel" opacity="0.4" />
        {!compact && (
          <>
            <path d={`M${FADED.x + 9} ${FADED.y + 9} L${FADED.x + 28} ${FADED.y + 22}`} className="stroke-on-panel/55" strokeWidth="1.2" strokeLinecap="round" />
            <text x={FADED.x + 32} y={FADED.y + 28} className="fill-on-panel text-[15.5px] font-medium">41%</text>
          </>
        )}
      </g>

      {/* stage 4: legend, Fresh to Faded, centered under the graph */}
      <g className="scene-stage" style={stage(4)}>
        {[1, 0.78, 0.58, 0.4, 0.26, 0.14].map((o, i) => (
          <circle key={i} cx={240 + i * 20} cy="372" r="4.5" className="fill-on-panel" opacity={o} />
        ))}
        {!compact && (
          <g className="fill-on-panel/90 text-[14.5px]">
            <text x="228" y="377" textAnchor="end">Fresh</text>
            <text x="352" y="377">Faded</text>
          </g>
        )}
      </g>
    </svg>
  );
}
