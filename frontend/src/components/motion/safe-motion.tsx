"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

import { AnimatedGroup } from "@/components/motion-primitives/animated-group";
import { TextEffect } from "@/components/motion-primitives/text-effect";

// Small helpers around the "motion" library (decisions A29), so every animation in the app
// checks prefers-reduced-motion in one place.

// Fades each child in and lifts it a little, one after the other (about 0.4 s each). Used for the
// login and register pages. Under reduced motion the children simply appear: same structure, no
// movement (so nothing is remounted when the preference is read).
const STILL: { container: Variants; item: Variants } = {
  container: { hidden: {}, visible: {} },
  item: { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } },
};

const RISE: { container: Variants; item: Variants } = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } },
  item: {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  },
};

// How long a short transition lasts: the given seconds, or 0 when the person asked for less motion.
export function useDuration(seconds: number): number {
  return useReducedMotion() ? 0 : seconds;
}

// A new chat message fades in and rises 4 px (0.18 s). Only a message that is added while the chat is
// open should animate: `appear` is read once, when the message first shows, so messages loaded from
// history and text that streams into an existing message never animate.
export function Appear({ appear, children }: { appear: boolean; children: ReactNode }) {
  const duration = useDuration(0.18);
  return (
    <motion.div
      initial={appear && duration > 0 ? { opacity: 0, y: 4 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// The empty-chat greeting: the words fade in one by one (Motion Primitives "Text Effect"). Same
// structure under reduced motion, just no movement. Screen readers get the whole sentence at once.
const STILL_TEXT: { container: Variants; item: Variants } = {
  container: { hidden: { opacity: 1 }, visible: { opacity: 1 } },
  item: { hidden: { opacity: 1, y: 0, filter: "blur(0px)" }, visible: { opacity: 1, y: 0, filter: "blur(0px)" } },
};

export function Greeting({ text, className }: { text: string; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <TextEffect
      as="h1"
      per="word"
      preset="fade-in-blur"
      speedSegment={0.9}
      variants={reduced ? STILL_TEXT : undefined}
      className={className}
    >
      {text}
    </TextEffect>
  );
}

export function Entrance({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <AnimatedGroup className={className} variants={reduced ? STILL : RISE}>
      {children}
    </AnimatedGroup>
  );
}
