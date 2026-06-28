"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

/* Just a Pinch's reveal reads warmer and softer than the studio's crisp
   fade-and-lift: content rises further, eases in on a gentler curve, settles
   down from a hair of scale, and de-blurs into focus — like a plate being set
   down. A deliberately different motion signature from shift9.dev. */
const WARM_EASE = [0.16, 0.84, 0.44, 1] as const;

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 34, scale: 0.985, filter: "blur(7px)" }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: reduced ? 0 : 0.85,
        delay: reduced ? 0 : delay,
        ease: WARM_EASE,
      }}
    >
      {children}
    </motion.div>
  );
}
