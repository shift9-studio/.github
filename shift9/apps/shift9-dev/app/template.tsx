"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Route transition — the surface "powers on" like the instrument redrawing
 * itself. A single signal hairline sweeps the viewport (the SYNC scan) while
 * the new content settles. `template.tsx` remounts on every navigation, so
 * this runs on each route change, not just first load.
 *
 * First load is special: we skip the content opacity fade so the largest
 * element paints immediately (protects LCP) and only run the scan line. Client
 * navigations get the full boot (scan + settle), tracked via a module flag.
 *
 * Deliberately NO transform/filter on the content wrapper: those establish a
 * containing block and would break the page's own `position: fixed` overlays
 * (GridFrame, CustomCursor). Opacity is safe; the scan line is a fixed,
 * transform-animated element that holds no fixed descendants.
 *
 * Fully gated by reduced motion: those sessions render the route instantly.
 */
const EASE = [0.16, 1, 0.3, 1] as const;
let booted = false; // false only for the very first mount of the session

export default function Template({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion() ?? false;
  const firstLoad = React.useRef(!booted);
  React.useEffect(() => {
    booted = true;
  }, []);

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
      {firstLoad.current ? (
        children
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, ease: EASE, delay: 0.06 }}
        >
          {children}
        </motion.div>
      )}
    </>
  );
}
