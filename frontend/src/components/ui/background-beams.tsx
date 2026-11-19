"use client";
// Aceternity UI "Background Beams", copied as a single component (decisions A29) and changed to
// follow our rules:
//  - colors come from theme tokens (the original used hex codes: rule A21),
//  - no Math.random (it gave different values on the server and in the browser),
//  - under prefers-reduced-motion the beams are drawn still, with no moving light,
//  - the 50 path strings are made by a loop instead of being written out twice.
import React from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

const COUNT = 32;

// Path number i is path 0 moved 7 units right and 8 units up, which is how the original set was made.
const PATHS = Array.from({ length: COUNT }, (_, i) => {
  const x = (n: number) => n + 7 * i;
  const y = (n: number) => n - 8 * i;
  return `M${x(-380)} ${y(-189)}C${x(-380)} ${y(-189)} ${x(-312)} ${y(216)} ${x(152)} ${y(343)}C${x(616)} ${y(470)} ${x(684)} ${y(875)} ${x(684)} ${y(875)}`;
});

// Fixed "random-looking" numbers from the index, so the server and the browser agree.
const wobble = (i: number, salt: number) => ((i * 7919 + salt * 104729) % 1000) / 1000;

export const BackgroundBeams = React.memo(({ className }: { className?: string }) => {
  const reduced = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 flex h-full w-full items-center justify-center", className)}
    >
      <svg
        className="absolute z-0 h-full w-full"
        width="100%"
        height="100%"
        viewBox="0 0 696 316"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {PATHS.map((d, i) => (
          <path
            key={`base-${i}`}
            d={d}
            style={{ stroke: "var(--on-panel)" }}
            strokeOpacity={0.07}
            strokeWidth="0.5"
          />
        ))}

        {!reduced && (
          <>
            {PATHS.map((d, i) => (
              <path
                key={`beam-${i}`}
                d={d}
                style={{ stroke: `url(#beam-gradient-${i})` }}
                strokeOpacity={0.55}
                strokeWidth="0.6"
              />
            ))}
            <defs>
              {PATHS.map((_, i) => (
                <motion.linearGradient
                  id={`beam-gradient-${i}`}
                  key={`gradient-${i}`}
                  initial={{ x1: "0%", x2: "0%", y1: "0%", y2: "0%" }}
                  animate={{
                    x1: ["0%", "100%"],
                    x2: ["0%", "95%"],
                    y1: ["0%", "100%"],
                    y2: ["0%", `${93 + wobble(i, 1) * 8}%`],
                  }}
                  transition={{
                    duration: 16 + wobble(i, 2) * 10,
                    ease: "easeInOut",
                    repeat: Infinity,
                    delay: wobble(i, 3) * 10,
                  }}
                >
                  <stop style={{ stopColor: "var(--panel-teal)", stopOpacity: 0 }} />
                  <stop style={{ stopColor: "var(--panel-teal)" }} />
                  <stop offset="32.5%" style={{ stopColor: "var(--panel-live)" }} />
                  <stop offset="100%" style={{ stopColor: "var(--panel-live)", stopOpacity: 0 }} />
                </motion.linearGradient>
              ))}
            </defs>
          </>
        )}
      </svg>
    </div>
  );
});

BackgroundBeams.displayName = "BackgroundBeams";
