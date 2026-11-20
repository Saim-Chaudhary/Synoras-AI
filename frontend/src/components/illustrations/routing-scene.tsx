import type { CSSProperties } from "react";
import { useId } from "react";

// The register picture: how Synoras picks a model for each message (decisions A29, A23).
// Read from top to bottom:  Message -> Classifier -> Models -> Answer.
// The classifier rates the difficulty (low, medium, high); the route then goes to a model of the
// matching size: Local (free, fast), Small cloud (low cost) or Strong cloud (higher cost), and the
// answer comes back with a routing log (model, time, cost).
// Original drawing, theme tokens only, decorative. Motion is CSS (globals.css, section 7) and is
// off under prefers-reduced-motion, so the finished picture is shown still.

type Props = {
  compact?: boolean; // the small version for the phone header: no side labels or small text
  className?: string;
};

const stage = (n: number): CSSProperties => ({ ["--stage" as string]: n });
const travel = (d: string, seconds: number, delay: number): CSSProperties => ({
  offsetPath: `path("${d}")`,
  ["--travel" as string]: `${seconds}s`,
  ["--travel-delay" as string]: `${delay}s`,
});

// The three routes from the classifier to a model and from the model to the answer. Each signal
// takes its own time: the small model answers fastest, the big one takes longest. The nodes are
// spaced wide so the labels under them never touch.
const MODELS = [
  { name: "Local", note: "free, fast", x: 120, r: 18, down: "M120 340 C120 368 240 360 240 382", up: "M240 218 C240 242 120 240 120 260", seconds: 2.4, delay: 0 },
  { name: "Small cloud", note: "low cost", x: 240, r: 26, down: "M240 348 L240 382", up: "M240 218 L240 252", seconds: 3.6, delay: 1.2 },
  { name: "Strong cloud", note: "higher cost", x: 360, r: 34, down: "M360 356 C360 376 240 366 240 382", up: "M240 218 C240 238 360 234 360 244", seconds: 5, delay: 2.2 },
];

const W = 420;
const H = 486;

export default function RoutingScene({ compact = false, className }: Props) {
  const uid = useId().replace(/:/g, "");
  const grid = `grid-${uid}`;
  const fade = `fade-${uid}`;
  const mask = `mask-${uid}`;

  return (
    <svg
      viewBox={compact ? `96 0 ${W - 96} ${H}` : `0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="A message is rated by a classifier and routed to a local, small cloud or strong cloud model. The answer comes back with a log of the model, time and cost."
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

      <rect width={W} height={H} fill={`url(#${grid})`} opacity="0.2" mask={`url(#${mask})`} />

      {!compact && (
        <g className="fill-on-panel text-[15.5px] font-medium">
          <text x="4" y="42">Message</text>
          <text x="4" y="128">Classifier</text>
          <text x="4" y="282">Models</text>
          <text x="4" y="412">Answer</text>
        </g>
      )}

      {/* stage 0: the message */}
      <g className="scene-stage" style={stage(0)}>
        <rect x="150" y="18" width="180" height="36" rx="18" className="fill-on-panel/10 stroke-on-panel/45" strokeWidth="1.2" />
        <circle cx="170" cy="36" r="4" className="fill-panel-teal" />
        <path d="M184 36h112" className="stroke-on-panel/55" strokeWidth="2.4" strokeLinecap="round" />
      </g>

      {/* stage 1: down to the classifier */}
      <g className="scene-stage" style={stage(1)}>
        <path d="M240 56 L240 84" className="scene-flow stroke-panel-teal/70" strokeWidth="1.6" strokeLinecap="round" />
        <circle r="3" className="scene-travel fill-panel-teal" style={travel("M240 56 L240 84", 2.2, 0)} />
        <circle cx="240" cy="122" r="38" className="stroke-panel-teal" strokeWidth="2" />
        <circle cx="240" cy="122" r="13" className="fill-panel-live" />
        {!compact && (
          <g textAnchor="middle" className="fill-on-panel/92 text-[14.5px]">
            <text x="240" y="182">rates difficulty</text>
            <text x="240" y="199">low · medium · high</text>
          </g>
        )}
      </g>

      {/* stage 2: the route splits into three models of growing size */}
      <g className="scene-stage" style={stage(2)}>
        {MODELS.map((m) => (
          <g key={m.name}>
            <path d={m.up} className="scene-flow stroke-panel-teal/95" strokeWidth="2.4" strokeLinecap="round" />
            <circle r="3" className="scene-travel fill-panel-teal" style={travel(m.up, m.seconds, m.delay)} />
          </g>
        ))}
        {MODELS.map((m, i) => (
          <g key={m.name}>
            <circle cx={m.x} cy="278" r={m.r} className="fill-panel stroke-panel-teal" strokeWidth="1.6" />
            <circle cx={m.x} cy="278" r={m.r * 0.42} className="fill-panel-teal" opacity={0.45 + i * 0.25} />
            {!compact && (
              <g textAnchor="middle">
                <text x={m.x} y={278 + m.r + 17} className="fill-on-panel text-[15.5px] font-medium">{m.name}</text>
                <text x={m.x} y={278 + m.r + 33} className="fill-on-panel/90 text-[14px]">{m.note}</text>
              </g>
            )}
          </g>
        ))}
      </g>

      {/* stage 3: the answers converge on one reply */}
      <g className="scene-stage" style={stage(3)}>
        {MODELS.map((m) => (
          <path key={m.name} d={m.down} className="stroke-on-panel/40" strokeWidth="1.4" strokeLinecap="round" />
        ))}
        <rect x="166" y="382" width="148" height="48" rx="16" className="fill-on-panel/10 stroke-panel-teal" strokeWidth="1.6" />
        <path d="M184 398h86" className="stroke-on-panel/60" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M184 414h54" className="stroke-on-panel/60" strokeWidth="2.4" strokeLinecap="round" />
        <rect x="244" y="408" width="3" height="12" rx="1" className="scene-caret fill-panel-live" />
      </g>

      {/* stage 4: the routing log strip */}
      <g className="scene-stage" style={stage(4)}>
        <rect x={compact ? 110 : 100} y="446" width={compact ? 300 : 290} height="32" rx="10" className="stroke-on-panel/45" strokeWidth="1.2" strokeDasharray="4 4" />
        {!compact && (
          <text x="245" y="466" textAnchor="middle" className="fill-on-panel/92 text-[14.5px]">
            routing log: model, time, cost
          </text>
        )}
      </g>
    </svg>
  );
}
