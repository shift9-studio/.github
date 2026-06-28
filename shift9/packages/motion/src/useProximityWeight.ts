"use client";

import * as React from "react";
import { useReducedMotionSafe } from "./useReducedMotionSafe";
import { subscribeScroll, getScroll } from "./scrollSignal";

export interface ProximityOpts {
  minWeight?: number;
  maxWeight?: number;
  minWidth?: number;
  maxWidth?: number;
  radius?: number;
  ease?: number;
  /**
   * How much scroll VELOCITY pushes the type toward its heavy/narrow extreme,
   * 0 (cursor only) → 1 (full coupling). Fast scrolling makes the headline
   * gain weight and compress, settling back as you stop — the blueprint's
   * "wght interpolates on cursor distance AND scroll velocity" made real.
   */
  velocityFlex?: number;
}

/**
 * Proximity Weight — drives a variable font's `wght`/`wdth` axes from the
 * cursor's distance to the element AND from scroll velocity. Letters flex as
 * you approach, and surge heavier/narrower as you scroll fast.
 *
 * rAF-smoothed (never per-event thrash); scroll velocity comes from the shared
 * scroll signal. Under reduced motion it pins a fixed optical weight and does
 * nothing else (no cursor coupling, no velocity coupling).
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
    velocityFlex = 1,
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

    // Keep the shared scroll signal alive while mounted; we read it per-frame.
    const unsubscribe = subscribeScroll(() => {});

    const tick = () => {
      // Scroll velocity pulls the CURRENT target toward heavy + narrow.
      const sv = getScroll().velocity * velocityFlex;
      const aimW = targetW + (maxWeight - targetW) * sv;
      const aimWd = targetWd - (targetWd - minWidth) * sv;
      curW += (aimW - curW) * ease;
      curWd += (aimWd - curWd) * ease;
      el.style.fontVariationSettings = `"wght" ${curW.toFixed(1)}, "wdth" ${curWd.toFixed(2)}`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      unsubscribe();
      cancelAnimationFrame(raf);
    };
  }, [
    reduced,
    minWeight,
    maxWeight,
    minWidth,
    maxWidth,
    radius,
    ease,
    velocityFlex,
  ]);

  return ref;
}
