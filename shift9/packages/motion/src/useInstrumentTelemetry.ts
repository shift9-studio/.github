"use client";

import * as React from "react";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

/**
 * A single frame of instrument telemetry. All values are live measurements
 * of the real session — never faked.
 */
export interface TelemetrySnapshot {
  /** cursor position in viewport px */
  cx: number;
  cy: number;
  /** cursor mapped to 0–100 grid cells (matches the "X:094 · Y:012" grammar) */
  gx: number;
  gy: number;
  /** scroll depth, 0 → 1 */
  scroll: number;
  /** normalized, smoothed scroll velocity, 0 (still) → 1 (hard flick) */
  vy: number;
  /** scroll direction: -1 up, 0 idle, +1 down */
  dir: -1 | 0 | 1;
  /** smoothed frames-per-second (EMA) */
  fps: number;
  /** viewport size in px */
  vw: number;
  vh: number;
  /** label of the section currently filling the viewport (data-tele-section) */
  section: string;
}

type Subscriber = (s: TelemetrySnapshot) => void;

/**
 * useInstrumentTelemetry — the shared hot-path backbone for the LIVE frame.
 *
 * Owns exactly ONE passive `pointermove`, ONE rAF loop, and ONE
 * IntersectionObserver over `[data-tele-section]` for the entire HUD. It
 * writes measurements into a stable ref and fans them out through
 * `subscribe(cb)`; it triggers ZERO React re-renders, so consumers update the
 * DOM directly (textContent / transforms) on the compositor's budget.
 *
 * Under reduced motion the rAF loop is never started — the snapshot is
 * refreshed only on discrete pointer / scroll / resize / section events, so a
 * reduced-motion session sees a calm, event-driven readout instead of a
 * per-frame ticker. The loop also self-pauses while the tab is hidden.
 */
export function useInstrumentTelemetry() {
  const reduced = useReducedMotionSafe();
  const snapshot = React.useRef<TelemetrySnapshot>({
    cx: 0,
    cy: 0,
    gx: 0,
    gy: 0,
    scroll: 0,
    vy: 0,
    dir: 0,
    fps: 0,
    vw: 0,
    vh: 0,
    section: "",
  });
  const subs = React.useRef<Set<Subscriber>>(new Set());

  const subscribe = React.useCallback((cb: Subscriber) => {
    subs.current.add(cb);
    cb(snapshot.current); // prime immediately with current state
    return () => {
      subs.current.delete(cb);
    };
  }, []);

  React.useEffect(() => {
    const s = snapshot.current;
    const emit = () => {
      for (const cb of subs.current) cb(s);
    };

    const readViewport = () => {
      s.vw = window.innerWidth;
      s.vh = window.innerHeight;
    };
    const readScroll = () => {
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      s.scroll = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };
    readViewport();
    readScroll();

    const onMove = (e: PointerEvent) => {
      s.cx = e.clientX;
      s.cy = e.clientY;
      s.gx = Math.round((e.clientX / Math.max(1, s.vw)) * 100);
      s.gy = Math.round((e.clientY / Math.max(1, s.vh)) * 100);
      if (reduced) emit();
    };
    const onScroll = () => {
      readScroll();
      if (reduced) emit();
    };
    const onResize = () => {
      readViewport();
      readScroll();
      if (reduced) emit();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    // Active section — the one filling the most of the viewport.
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-tele-section]"),
    );
    const ratios = new Map<Element, number>();
    let io: IntersectionObserver | null = null;
    if (sections.length) {
      io = new IntersectionObserver(
        (entries) => {
          for (const en of entries)
            ratios.set(en.target, en.isIntersecting ? en.intersectionRatio : 0);
          let best: Element | null = null;
          let bestRatio = -1;
          for (const [el, r] of ratios)
            if (r > bestRatio) {
              bestRatio = r;
              best = el;
            }
          const label = best?.getAttribute("data-tele-section") ?? s.section;
          if (label !== s.section) {
            s.section = label;
            if (reduced) emit();
          }
        },
        { threshold: [0, 0.25, 0.5, 0.75, 1] },
      );
      sections.forEach((el) => io!.observe(el));
    }

    // Per-frame loop (skipped entirely under reduced motion).
    let raf = 0;
    let last = performance.now();
    let fpsEMA = 60;
    let running = !reduced;
    let lastSY = window.scrollY;
    let velEMA = 0; // smoothed px/frame
    const VMAX = 52; // px/frame → velocity 1.0 (matches scrollSignal)

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (dt > 0) fpsEMA += (1000 / dt - fpsEMA) * 0.1;
      s.fps = Math.max(1, Math.min(120, Math.round(fpsEMA)));
      const y = window.scrollY;
      const dy = y - lastSY;
      lastSY = y;
      velEMA += (Math.abs(dy) - velEMA) * 0.16;
      s.vy = Math.min(1, velEMA / VMAX);
      s.dir = dy > 0.5 ? 1 : dy < -0.5 ? -1 : 0;
      readScroll();
      emit();
      raf = running ? requestAnimationFrame(tick) : 0;
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      } else if (!reduced) {
        running = true;
        last = performance.now();
        if (!raf) raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    if (!reduced) {
      raf = requestAnimationFrame(tick);
    } else {
      emit(); // one settled frame for the static readout
    }

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      if (io) io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return { snapshot, subscribe, reduced };
}
