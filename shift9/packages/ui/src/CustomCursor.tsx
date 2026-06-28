"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Triple-layer cursor: a fast inner dot, a soft-spring trailing ring, and a
 * large, dim volumetric light bloom that lags a beat further behind — the
 * three-body lag reads as physical depth and makes moving the cursor feel
 * like sweeping a flashlight across a milled console. The bloom is
 * `mix-blend-mode: screen`, so over the dark void it can only *lift*
 * luminance — it never darkens text or reduces contrast.
 *
 * Activates only on pointer-capable (non-touch) devices and hides the native
 * cursor while mounted. Reads [data-cursor="pulse"] on hovered ancestors to
 * shift color from signal → pulse.
 */
export function CustomCursor() {
  const rawX = useMotionValue(-200);
  const rawY = useMotionValue(-200);
  const isPulse = useRef(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const bloomRef = useRef<HTMLDivElement>(null);

  const DOT_SPRING = { damping: 30, stiffness: 600, mass: 0.4 };
  const RING_SPRING = { damping: 22, stiffness: 180, mass: 0.7 };
  // Softer than the ring so the light trails one beat further behind it.
  const BLOOM_SPRING = { damping: 26, stiffness: 90, mass: 1.1 };

  const dx = useSpring(rawX, DOT_SPRING);
  const dy = useSpring(rawY, DOT_SPRING);
  const rx = useSpring(rawX, RING_SPRING);
  const ry = useSpring(rawY, RING_SPRING);
  const bx = useSpring(rawX, BLOOM_SPRING);
  const by = useSpring(rawY, BLOOM_SPRING);

  // Straight, token-derived radial gradients — swapped on the same hot path
  // that recolors the dot/ring, so the light matches the cursor's mood.
  const SIGNAL_BLOOM =
    "radial-gradient(closest-side, color-mix(in oklab, var(--s9-signal) 22%, transparent), transparent 72%)";
  const PULSE_BLOOM =
    "radial-gradient(closest-side, color-mix(in oklab, var(--s9-pulse) 22%, transparent), transparent 72%)";

  useEffect(() => {
    // Only activate on devices with a real pointer
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches)
      return;

    document.documentElement.classList.add("[&_*]:cursor-none", "cursor-none");

    const onMove = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);

      // Walk up the DOM to check for data-cursor attribute
      const target = e.target as Element | null;
      const closest = target?.closest("[data-cursor]");
      const next = closest?.getAttribute("data-cursor") === "pulse";
      if (next !== isPulse.current) {
        isPulse.current = next;
        const color = next ? "#8b5cf6" : "#22d3ee";
        if (dotRef.current) dotRef.current.style.backgroundColor = color;
        if (ringRef.current) ringRef.current.style.borderColor = color;
        if (bloomRef.current)
          bloomRef.current.style.background = next ? PULSE_BLOOM : SIGNAL_BLOOM;
      }
    };

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.classList.remove(
        "[&_*]:cursor-none",
        "cursor-none"
      );
    };
  }, [rawX, rawY, PULSE_BLOOM, SIGNAL_BLOOM]);

  return (
    <>
      {/* Volumetric light bloom — large, dim, screen-blended; trails furthest.
          Sized in px (like the dot/ring) so it tracks the OS pointer, not the
          page's rem scale. Screen blend over the void can only add light. */}
      <motion.div
        ref={bloomRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9997] h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.12] [mix-blend-mode:screen]"
        style={{ x: bx, y: by, background: SIGNAL_BLOOM }}
      />
      {/* Inner dot — snaps quickly */}
      <motion.div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal"
        style={{ x: dx, y: dy }}
      />
      {/* Outer ring — trails with softer spring, scales up on interactive elements */}
      <motion.div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9998] h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-signal/60"
        style={{ x: rx, y: ry }}
      />
    </>
  );
}
