"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { subscribeScroll } from "@shift9/motion";
import { cn } from "@shift9/ui";

export interface HeadlineLine {
  text: string;
  /** render this line in the accent (signal) color */
  accent?: boolean;
}

export interface SeasonHeadlineProps {
  lines: HeadlineLine[];
  as?: "h1" | "h2";
  className?: string;
}

const WARM_EASE = [0.16, 0.84, 0.44, 1] as const;

/**
 * SeasonHeadline — Just a Pinch's headline motion. Instead of the studio's
 * cursor-proximity weight flex (ProximityText), each word rises and de-blurs
 * into place on a warm, staggered curve as the line scrolls in — words
 * "seasoning in" one after another, plated in the Fraunces serif. A distinct
 * text signature for the product surface.
 *
 * Nested variant orchestration: the heading staggers its lines, each line
 * staggers its words. Render output never branches on reduced motion (no SSR
 * mismatch); under reduced motion the stagger and per-word durations collapse
 * so the words simply appear.
 */
export function SeasonHeadline({
  lines,
  as = "h1",
  className,
}: SeasonHeadlineProps) {
  const reduced = useReducedMotion();
  const Heading = as === "h1" ? motion.h1 : motion.h2;
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  // Once plated, the whole headline gains weight with scroll velocity and
  // relaxes as you stop — Fraunces' wght axis inherits down to every word.
  // Disabled under reduced motion (no subscription, default weight stays).
  React.useEffect(() => {
    if (reduced) return;
    const el = headingRef.current;
    if (!el) return;
    return subscribeScroll((s) => {
      const w = 360 + 320 * s.velocity;
      el.style.fontVariationSettings = `"wght" ${w.toFixed(0)}`;
    });
  }, [reduced]);

  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduced ? 0 : 0.07, delayChildren: 0.04 },
    },
  };
  const lineV: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduced ? 0 : 0.055 } },
  };
  const wordV: Variants = {
    hidden: { opacity: 0, y: "0.62em", filter: "blur(10px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: reduced ? 0 : 0.7, ease: WARM_EASE },
    },
  };

  return (
    <Heading
      ref={headingRef}
      className={cn("font-display leading-[0.95]", className)}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-70px" }}
    >
      {lines.map((line, li) => {
        const words = line.text.split(" ");
        return (
          <motion.span
            key={li}
            variants={lineV}
            className={cn("block", line.accent && "text-signal")}
          >
            {words.map((word, j) => (
              <React.Fragment key={j}>
                <motion.span
                  variants={wordV}
                  className="inline-block will-change-[transform,filter]"
                >
                  {word}
                </motion.span>
                {j < words.length - 1 ? " " : null}
              </React.Fragment>
            ))}
          </motion.span>
        );
      })}
    </Heading>
  );
}
