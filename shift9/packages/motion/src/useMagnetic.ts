"use client";

import * as React from "react";
import { useMotionValue, useSpring } from "framer-motion";
import { springs } from "./springs";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

export interface MagneticBind {
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerLeave: () => void;
}

/**
 * Magnetic pull — the element drifts toward the cursor within `radius`,
 * settling on a spring. Disabled entirely under reduced motion.
 *
 * Returns spring-backed `x`/`y` MotionValues to bind via `style`, plus a
 * `bind` object to spread onto the element's pointer handlers.
 */
export function useMagnetic<T extends HTMLElement = HTMLElement>(
  strength = 0.35,
  radius = 120,
) {
  const ref = React.useRef<T>(null);
  const reduced = useReducedMotionSafe();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, springs.magnetic);
  const sy = useSpring(y, springs.magnetic);

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      const el = ref.current;
      if (reduced || !el) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const reach = radius + Math.max(r.width, r.height) / 2;
      if (Math.hypot(dx, dy) <= reach) {
        x.set(dx * strength);
        y.set(dy * strength);
      }
    },
    [reduced, radius, strength, x, y],
  );

  const onPointerLeave = React.useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return {
    ref,
    x: sx,
    y: sy,
    bind: { onPointerMove, onPointerLeave } as MagneticBind,
    reduced,
  };
}
