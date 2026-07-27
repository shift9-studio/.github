"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useReducedMotionSafe } from "@shift9/motion";

/**
 * Triple-layer cursor: a fast inner dot, a soft-spring trailing ring, and a
 * large, dim volumetric light bloom that lags a beat further behind — the
 * three-body lag reads as physical depth and makes moving the cursor feel
 * like sweeping a flashlight across a milled console. The bloom is
 * `mix-blend-mode: screen`, so over the dark void it can only *lift*
 * luminance — it never darkens text or reduces contrast.
 *
 * On top of the follow, the ring is a live instrument:
 *  - it DOCKS onto interactive targets (links, buttons), scaling up and
 *    dimming so it reads as a focus reticle around the thing you can act on;
 *  - it SQUASHES along travel direction with pointer velocity (squash-and-
 *    stretch), so fast flicks feel weighty;
 *  - it PULSES inward on press for tactile click feedback.
 * These three flourishes are gated by reduced motion; the base follow stays.
 *
 * Activates only on pointer-capable (non-touch) devices and hides the native
 * cursor while mounted. Reads [data-cursor="pulse"] on hovered ancestors to
 * shift colour from signal → pulse.
 */
export function CustomCursor() {
  const reduced = useReducedMotionSafe();

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

  // Ring scale: 1 at rest, up when docked to a target, in on press.
  const ringScaleRaw = useMotionValue(1);
  const ringScale = useSpring(ringScaleRaw, {
    stiffness: 320,
    damping: 22,
    mass: 0.6,
  });
  // Velocity stretch: 0 still → ~1 fast; drives anisotropic scale + rotation.
  const stretchRaw = useMotionValue(0);
  const stretch = useSpring(stretchRaw, {
    stiffness: 220,
    damping: 26,
    mass: 0.5,
  });
  const ringAngle = useMotionValue(0);
  const ringSX = useTransform([ringScale, stretch], (v: number[]) => {
    const s = v[0] ?? 1;
    const st = v[1] ?? 0;
    return s * (1 + st * 0.55);
  });
  const ringSY = useTransform([ringScale, stretch], (v: number[]) => {
    const s = v[0] ?? 1;
    const st = v[1] ?? 0;
    return s * (1 - st * 0.3);
  });
  // Dot pulses inward on press.
  const dotScaleRaw = useMotionValue(1);
  const dotScale = useSpring(dotScaleRaw, {
    stiffness: 500,
    damping: 20,
    mass: 0.4,
  });

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

    const INTERACTIVE =
      'a, button, [role="button"], input, textarea, select, label, summary, [data-cursor-target]';
    let interactive = false;
    let pressed = false;
    let accent = "#e8edf5";

    const applyRingScale = () => {
      // Dock to a measured 1.95× on targets; a gentle inward press at 0.84×.
      ringScaleRaw.set((interactive ? 1.95 : 1) * (pressed ? 0.84 : 1));
    };

    // Paint the ring as a "lock-on" reticle: full accent + a faint fill when
    // docked to a target, a calm 60% hairline otherwise.
    const paintRing = () => {
      const el = ringRef.current;
      if (!el) return;
      el.style.borderColor = accent;
      el.style.opacity = interactive ? "1" : "0.6";
      el.style.backgroundColor = interactive ? `${accent}14` : "transparent";
    };

    const onMove = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);

      const target = e.target as Element | null;

      // Velocity squash-and-stretch (skipped under reduced motion).
      if (!reduced) {
        const speed = Math.hypot(e.movementX, e.movementY);
        stretchRaw.set(Math.min(1, speed / 48));
        if (speed > 0.5)
          ringAngle.set((Math.atan2(e.movementY, e.movementX) * 180) / Math.PI);

        const overInteractive = !!target?.closest(INTERACTIVE);
        if (overInteractive !== interactive) {
          interactive = overInteractive;
          applyRingScale();
          paintRing();
        }
      }

      // Mood: walk up the DOM for a data-cursor="pulse" ancestor.
      const closest = target?.closest("[data-cursor]");
      const next = closest?.getAttribute("data-cursor") === "pulse";
      if (next !== isPulse.current) {
        isPulse.current = next;
        accent = next ? "#6f7b8f" : "#e8edf5";
        if (dotRef.current) dotRef.current.style.backgroundColor = accent;
        if (bloomRef.current)
          bloomRef.current.style.background = next ? PULSE_BLOOM : SIGNAL_BLOOM;
        paintRing();
      }
    };

    const onDown = () => {
      if (reduced) return;
      pressed = true;
      applyRingScale();
      dotScaleRaw.set(0.5);
    };
    const onUp = () => {
      if (reduced) return;
      pressed = false;
      applyRingScale();
      dotScaleRaw.set(1);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.classList.remove(
        "[&_*]:cursor-none",
        "cursor-none",
      );
    };
  }, [
    rawX,
    rawY,
    reduced,
    ringScaleRaw,
    stretchRaw,
    ringAngle,
    dotScaleRaw,
    PULSE_BLOOM,
    SIGNAL_BLOOM,
  ]);

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
      {/* Inner dot — snaps quickly, pulses inward on press */}
      <motion.div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal"
        style={{ x: dx, y: dy, scale: dotScale }}
      />
      {/* Outer ring — trails softer, docks onto targets, squashes with velocity */}
      <motion.div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9998] h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-signal/60"
        style={{
          x: rx,
          y: ry,
          scaleX: ringSX,
          scaleY: ringSY,
          rotate: ringAngle,
        }}
      />
    </>
  );
}
