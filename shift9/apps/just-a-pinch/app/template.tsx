"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Route transition for Just a Pinch — the same "power-on" boot as the studio
 * site, tinted by this surface's warm --s9-signal (saffron). A scan hairline
 * sweeps the viewport while the new content settles. No transform/filter on
 * the content wrapper (it would break the warm GrainField / fixed overlays);
 * opacity + a fixed scan line only. Gated by reduced motion.
 */
const EASE = [0.16, 1, 0.3, 1] as const;

export default function Template({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion() ?? false;
  if (reduced) return <>{children}</>;

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[9990] h-px bg-signal"
        style={{ boxShadow: "0 0 12px 1px var(--s9-signal)" }}
        initial={{ y: "-2vh", opacity: 0 }}
        animate={{ y: "102vh", opacity: [0, 1, 1, 0] }}
        transition={{ duration: 0.72, ease: EASE, times: [0, 0.12, 0.85, 1] }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, ease: EASE, delay: 0.06 }}
      >
        {children}
      </motion.div>
    </>
  );
}
