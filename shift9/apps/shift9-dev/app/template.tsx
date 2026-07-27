"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Route transition — the new content settles in. `template.tsx` remounts on
 * every navigation, so this runs on each route change, not just first load.
 *
 * There used to be a glowing Signal hairline sweeping the full viewport here
 * too — the instrument "powering on". It went for two reasons. It is the old
 * chrome's signature, and every surface it now sweeps across is black rather
 * than the navy it was drawn for. And the desktop already has a real
 * transition into the studio: the wipe fired first and the cyan line then
 * swept over the top of it, so the one route that had a considered handoff
 * was the one route showing two at once.
 *
 * What is left is voice-neutral — a settle, not a signature — which is what a
 * route change between four surfaces with four different looks needs to be.
 *
 * First load is special: we skip the content opacity fade so the largest
 * element paints immediately (protects LCP) and only run the scan line. Client
 * navigations get the full boot (scan + settle), tracked via a module flag.
 *
 * Deliberately NO transform/filter on the content wrapper: those establish a
 * containing block and would break any `position: fixed` overlay the page
 * owns — the entrance's gate and its wipe are both fixed. Opacity is safe.
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
