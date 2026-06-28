"use client";

import * as React from "react";
import { useMotionValue, useSpring, type MotionValue } from "framer-motion";
import {
  subscribeScroll,
  getScroll,
  type ScrollState,
} from "./scrollSignal";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

export interface ScrollVelocity {
  /** spring-smoothed normalized velocity (0..1) — bind straight to `style`. */
  velocity: MotionValue<number>;
  /** the live shared scroll state, for synchronous reads inside your own rAF. */
  scroll: () => Readonly<ScrollState>;
  reduced: boolean;
}

/**
 * useScrollVelocity — a spring-smoothed normalized scroll speed as a
 * framer-motion `MotionValue`, plus a synchronous accessor for rAF consumers.
 *
 * Backed by the shared {@link subscribeScroll} singleton, so any number of
 * callers cost one listener and one rAF. Under reduced motion the value is
 * pinned to 0 and nothing subscribes, so velocity-driven motion is inert.
 */
export function useScrollVelocity(): ScrollVelocity {
  const reduced = useReducedMotionSafe();
  const raw = useMotionValue(0);
  const velocity = useSpring(raw, { stiffness: 170, damping: 26, mass: 0.5 });

  React.useEffect(() => {
    if (reduced) {
      raw.set(0);
      return;
    }
    return subscribeScroll((s) => raw.set(s.velocity));
  }, [reduced, raw]);

  return { velocity, scroll: getScroll, reduced };
}
