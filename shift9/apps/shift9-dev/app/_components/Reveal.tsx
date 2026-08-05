"use client";

import * as React from "react";
import {
  motion,
  useReducedMotion,
  type TargetAndTransition,
  type Variants,
} from "framer-motion";

/**
 * Scroll-reveal vocabulary for shift9.dev. One generic fade-up used to carry
 * every section; now each block picks the motion that fits it:
 *
 *  - `rise` : the crisp fade-and-lift (the studio default)
 *  - `scan` : a top-down clip wipe, as if the grid is drawing the panel in
 *  - `mask` : a headline rising out of a clipped band
 *  - `fade` : opacity only, for things that shouldn't move
 *
 * Pair `RevealGroup` + `RevealItem` for grids: the parent orchestrates a real
 * stagger instead of each child independently crossing its own viewport line.
 *
 * All variants decelerate on the house `--s9-ease-out` curve and collapse to a
 * plain instant appear under reduced motion (no SSR branch — output is stable).
 */
export type RevealVariant = "rise" | "scan" | "mask" | "fade";

const EASE_OUT = [0.16, 1, 0.3, 1] as const; // mirrors --s9-ease-out

/* ── The clip-path rule, and why it exists ──────────────────────────────────
   `clipPath` does not animate when a variant is driven by this component's own
   `whileInView` prop. It is applied at the `hidden` value and never tweened, so
   an element wrapped in a clip-carrying variant stays clipped to nothing —
   permanently invisible — and it fails SILENTLY: no console error, no warning.

   Measured on a production build, 2026-08-05, four `motion.div`s with identical
   whileInView wiring differing only in what they animate:

     opacity only        → opacity 1     ✓ revealed
     opacity + y         → opacity 1     ✓ revealed
     clipPath only       → clipPath stuck at inset(0% 0% 100%)   ✗ invisible
     opacity + clipPath  → both stuck                            ✗ invisible

   That is what broke `mask` and `scan`. It is NOT the `"0.45em"` y-value that
   was originally suspected — `scan` already used a plain number and failed the
   same way, which is what ruled the em-string out.

   The same clip-carrying variants DO work through `RevealGroup`/`RevealItem`,
   where the parent propagates the variant rather than the child observing its
   own viewport — proven by the offer cards on /services, which use
   `RevealItem variant="scan"` and render correctly.

   So the clip is stripped for the `whileInView` path only, and kept for the
   orchestrated path. `mask` and `scan` still read as themselves there; here
   they degrade to their own motion minus the wipe, which is a real reveal
   rather than a blank space. The underlying framer-motion cause is not yet
   understood and is deliberately not guessed at — the behaviour is measured,
   the workaround is scoped, and the note is here so the next person does not
   re-suspect the em-string. */
function stripClip(vs: Variants): Variants {
  const out: Variants = {};
  for (const key of Object.keys(vs)) {
    const { clipPath: _clipPath, ...rest } = vs[key] as TargetAndTransition;
    out[key] = rest;
  }
  return out;
}

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
  const t = (duration: number) => ({ duration, delay, ease: EASE_OUT });
  switch (v) {
    case "scan":
      return {
        hidden: { opacity: 0, clipPath: "inset(0% 0% 100% 0%)", y: 14 },
        show: {
          opacity: 1,
          clipPath: "inset(0% 0% 0% 0%)",
          y: 0,
          transition: t(0.7),
        },
      };
    case "mask":
      return {
        hidden: { opacity: 0, clipPath: "inset(0% 0% 100% 0%)", y: "0.45em" },
        show: {
          opacity: 1,
          clipPath: "inset(0% 0% 0% 0%)",
          y: 0,
          transition: t(0.85),
        },
      };
    case "fade":
      return {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: t(0.6) },
      };
    case "rise":
    default:
      return {
        hidden: { opacity: 0, y: 22 },
        show: { opacity: 1, y: 0, transition: t(0.62) },
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
      /* stripClip: this is the whileInView path, where clipPath never tweens.
         See the note above variantsFor. */
      variants={stripClip(variantsFor(variant, reduced, delay))}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered container. Children rendered as `RevealItem` animate in sequence
 * once the group enters the viewport — a single orchestrated entrance rather
 * than N independent ones.
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.062, // mirrors --s9-stagger
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
