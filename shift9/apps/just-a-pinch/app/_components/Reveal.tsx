"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

/* Just a Pinch's reveal reads warmer and softer than the studio's crisp
   fade-and-lift: content rises further, eases in on a gentler curve, settles
   down from a hair of scale, and de-blurs into focus — like a plate being set
   down. A deliberately different motion signature from shift9.dev.

   Same variant vocabulary as the studio (rise / scan / mask / fade) and the
   same RevealGroup + RevealItem stagger, tuned to the warm curve. */
export type RevealVariant = "rise" | "scan" | "mask" | "fade";

const WARM_EASE = [0.16, 0.84, 0.44, 1] as const;

function variantsFor(
  v: RevealVariant,
  reduced: boolean,
  delay: number,
): Variants {
  if (reduced) {
    return {
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: { duration: 0, delay: 0 } },
    };
  }
  const t = (duration: number) => ({ duration, delay, ease: WARM_EASE });
  switch (v) {
    case "scan":
      return {
        hidden: {
          opacity: 0,
          clipPath: "inset(0% 0% 100% 0%)",
          y: 22,
          filter: "blur(6px)",
        },
        show: {
          opacity: 1,
          clipPath: "inset(0% 0% 0% 0%)",
          y: 0,
          filter: "blur(0px)",
          transition: t(0.9),
        },
      };
    case "mask":
      return {
        hidden: {
          opacity: 0,
          clipPath: "inset(0% 0% 100% 0%)",
          y: "0.5em",
        },
        show: {
          opacity: 1,
          clipPath: "inset(0% 0% 0% 0%)",
          y: 0,
          transition: t(0.95),
        },
      };
    case "fade":
      return {
        hidden: { opacity: 0, filter: "blur(6px)" },
        show: { opacity: 1, filter: "blur(0px)", transition: t(0.75) },
      };
    case "rise":
    default:
      return {
        hidden: { opacity: 0, y: 34, scale: 0.985, filter: "blur(7px)" },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          transition: t(0.85),
        },
      };
  }
}

export function Reveal({
  children,
  delay = 0,
  variant = "rise",
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  variant?: RevealVariant;
  className?: string;
}) {
  const reduced = useReducedMotion() ?? false;
  return (
    <motion.div
      className={className}
      variants={variantsFor(variant, reduced, delay)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}

/** Staggered container — children as `RevealItem` plate in one after another. */
export function RevealGroup({
  children,
  className,
  stagger = 0.07,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}) {
  const reduced = useReducedMotion() ?? false;
  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduced ? 0 : stagger,
        delayChildren: reduced ? 0 : delay,
      },
    },
  };
  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-70px" }}
    >
      {children}
    </motion.div>
  );
}

/** A child of `RevealGroup`; inherits the parent's staggered timing. */
export function RevealItem({
  children,
  variant = "rise",
  className,
}: {
  children: React.ReactNode;
  variant?: RevealVariant;
  className?: string;
}) {
  const reduced = useReducedMotion() ?? false;
  return (
    <motion.div className={className} variants={variantsFor(variant, reduced, 0)}>
      {children}
    </motion.div>
  );
}
