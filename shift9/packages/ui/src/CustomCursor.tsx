"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Dual-layer cursor: a fast inner dot + a soft-spring trailing ring.
 * Activates only on pointer-capable (non-touch) devices and hides the
 * native cursor while mounted. Reads [data-cursor="pulse"] on hovered
 * ancestors to shift color from signal → pulse.
 */
export function CustomCursor() {
  const rawX = useMotionValue(-200);
  const rawY = useMotionValue(-200);
  const isPulse = useRef(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const DOT_SPRING = { damping: 30, stiffness: 600, mass: 0.4 };
  const RING_SPRING = { damping: 22, stiffness: 180, mass: 0.7 };

  const dx = useSpring(rawX, DOT_SPRING);
  const dy = useSpring(rawY, DOT_SPRING);
  const rx = useSpring(rawX, RING_SPRING);
  const ry = useSpring(rawY, RING_SPRING);

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
  }, [rawX, rawY]);

  return (
    <>
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
