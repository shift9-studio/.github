"use client";

import * as React from "react";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

export interface ProximityOpts {
  minWeight?: number;
  maxWeight?: number;
  minWidth?: number;
  maxWidth?: number;
  radius?: number;
  ease?: number;
}

/**
 * Proximity Weight — drives a variable font's `wght`/`wdth` axes from the
 * cursor's distance to the element. Letters flex as you approach.
 *
 * rAF-smoothed (never per-event thrash). Under reduced motion it pins a
 * fixed optical weight and does nothing else.
 */
export function useProximityWeight<T extends HTMLElement = HTMLHeadingElement>(
  opts: ProximityOpts = {},
) {
  const {
    minWeight = 260,
    maxWeight = 900,
    minWidth = 88,
    maxWidth = 106,
    radius = 320,
    ease = 0.1,
  } = opts;
  const ref = React.useRef<T>(null);
  const reduced = useReducedMotionSafe();

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced) {
      el.style.fontVariationSettings = `"wght" ${Math.round(
        (minWeight + maxWeight) / 2,
      )}, "wdth" 100`;
      return;
    }

    let raf = 0;
    let targetW = minWeight;
    let targetWd = (minWidth + maxWidth) / 2;
    let curW = targetW;
    let curWd = targetWd;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const t = Math.max(0, Math.min(1, 1 - Math.hypot(dx, dy) / radius));
      targetW = minWeight + (maxWeight - minWeight) * t;
      targetWd = minWidth + (maxWidth - minWidth) * t;
    };

    const tick = () => {
      curW += (targetW - curW) * ease;
      curWd += (targetWd - curWd) * ease;
      el.style.fontVariationSettings = `"wght" ${curW.toFixed(1)}, "wdth" ${curWd.toFixed(2)}`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced, minWeight, maxWeight, minWidth, maxWidth, radius, ease]);

  return ref;
}
