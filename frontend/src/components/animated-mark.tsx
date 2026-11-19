// The Synoras logo mark as an inline SVG, so it can move (decisions A26). It has the same 19
// dots at the same places as public/logo-mark.svg, which stays the still version used for the
// favicon and the sidebar. The big amber dot is in the middle.
//
//   mode "still"    no motion
//   mode "ambient"  the dots drift all the time, slowly, like bubbles (brand moments)
//   mode "thinking" the same drift, faster and wider (something is loading)
//
// The animation itself lives in globals.css and is switched off for people who prefer reduced
// motion. Colors come from tokens (--mark-dot, --live), never from hex codes here.

import type { CSSProperties } from "react";

// [cx, cy, radius, opacity] of every dot, copied from logo-mark.svg. Index 0 is the amber one.
const DOTS: [number, number, number, number][] = [
  [36.67, 32, 5.9, 1],
  [26.04, 37.46, 5.6, 0.97],
  [32.91, 21.6, 5.36, 0.94],
  [39.51, 41.8, 5.14, 0.92],
  [18.21, 29.56, 4.93, 0.89],
  [45.06, 23.69, 4.72, 0.86],
  [27.63, 48.25, 4.52, 0.83],
  [23.67, 15.96, 4.33, 0.81],
  [50.07, 38.6, 4.14, 0.78],
  [13.2, 39.76, 3.96, 0.75],
  [41.07, 12.63, 3.78, 0.72],
  [38.7, 53.36, 3.6, 0.69],
  [11.81, 20.3, 3.42, 0.67],
  [55.68, 26.79, 3.25, 0.64],
  [17.54, 52.56, 3.07, 0.61],
  [28.66, 6.23, 2.9, 0.58],
  [52.5, 49.28, 2.73, 0.56],
  [4.41, 33.14, 2.57, 0.53],
  [52.12, 11.98, 2.4, 0.5],
];

// How each dot drifts: [fx, fy, fd, fo] = how far it wanders sideways and up and down (logo
// units), seconds for one full wander, and where in the wander it starts. The numbers differ
// from dot to dot so the dots never move together. They are fixed (not random), so the server
// and the browser draw exactly the same thing.
const DRIFT: [number, number, number, number][] = [
  [-1.59, -1.67, 5.3, 2.8],
  [-1.64, -2.29, 5.1, 2.2],
  [-1.28, -1.86, 7.9, 1.0],
  [-1.47, 1.89, 5.2, 1.1],
  [-1.87, -1.55, 6.9, 3.9],
  [-1.87, -1.32, 6.3, 3.5],
  [-1.28, 1.94, 7.4, 3.2],
  [1.58, -1.63, 7.8, 5.5],
  [1.49, 1.83, 7.6, 2.2],
  [-2.38, -1.81, 7.6, 1.2],
  [-1.79, -2.35, 7.7, 4.4],
  [2.25, 1.61, 7.1, 4.1],
  [-1.75, 2.33, 7.4, 0.5],
  [2.08, 1.98, 6.0, 2.3],
  [-2.0, 2.33, 5.6, 0.7],
  [1.27, -1.36, 6.4, 5.9],
  [-1.8, 1.74, 8.1, 6.6],
  [2.24, 2.05, 7.4, 2.8],
  [-1.48, -1.41, 7.3, 0.1],
];

export type MarkMode = "still" | "ambient" | "thinking";

type MarkProps = {
  size: number; // width and height in pixels
  mode?: MarkMode;
  tone?: "auto" | "onDark"; // "onDark" is for the navy brand panel (light dots in both themes)
  label?: string; // accessible name; pass "" when the text next to it already says it
  className?: string;
};

export function AnimatedMark({ size, mode = "still", tone = "auto", label = "Synoras AI", className }: MarkProps) {
  const style = (tone === "onDark" ? { "--mark-dot": "var(--on-panel)", "--mark-live": "var(--panel-live)" } : undefined) as CSSProperties | undefined;

  return (
    <svg
      viewBox="0 0 60 60"
      width={size}
      height={size}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      data-mark={mode === "still" ? undefined : mode}
      className={className}
      style={style}
    >
      {DOTS.map(([cx, cy, r, opacity], index) => {
        const [fx, fy, fd, fo] = DRIFT[index];
        // each dot is a group (it drifts); the amber one has a circle inside that also breathes
        const drift = { "--fx": fx, "--fy": fy, "--fd": fd, "--fo": fo } as CSSProperties;
        return (
          <g key={index} className="mark-dot" style={drift}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              className={index === 0 ? "mark-center" : undefined}
              style={{ fill: index === 0 ? "var(--mark-live, var(--live))" : "var(--mark-dot)", opacity }}
            />
          </g>
        );
      })}
    </svg>
  );
}

// The mark with the name, like public/logo-full.svg (the name is text in the app's Inter).
// `size` is the height of the mark; the name is sized in proportion, as in the logo file.
export function AnimatedLogo({
  size,
  mode = "still",
  tone = "auto",
}: {
  size: number;
  mode?: MarkMode;
  tone?: "auto" | "onDark";
}) {
  const style = (tone === "onDark" ? { "--mark-dot": "var(--on-panel)", "--mark-live": "var(--panel-live)" } : undefined) as CSSProperties | undefined;
  return (
    <span className="inline-flex items-center" style={{ gap: size * 0.11, ...style }}>
      <AnimatedMark size={size} mode={mode} tone={tone} label="" />
      <span
        className="font-semibold leading-none"
        style={{ fontSize: size * 0.54, letterSpacing: size * 0.007, color: tone === "onDark" ? "var(--on-panel)" : "var(--ink)" }}
      >
        Synoras
      </span>
    </span>
  );
}
