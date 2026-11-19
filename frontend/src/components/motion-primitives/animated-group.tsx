"use client";
// Motion Primitives "Animated Group", copied as a single component (decisions A29) and trimmed:
// it only draws <div>s (the original also took an `as` element and ten presets, and used the
// global JSX type that React 19 no longer has). Each child fades in and lifts in turn; the
// look is set by the `variants` that the caller passes (see components/motion/safe-motion.tsx).
import React, { type ReactNode } from "react";
import { motion, type Variants } from "motion/react";

export type AnimatedGroupProps = {
  children: ReactNode;
  className?: string;
  variants?: {
    container?: Variants;
    item?: Variants;
  };
};

const defaultContainerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const defaultItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

function AnimatedGroup({ children, className, variants }: AnimatedGroupProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants?.container ?? defaultContainerVariants}
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={variants?.item ?? defaultItemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export { AnimatedGroup };
