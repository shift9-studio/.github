"use client";

import * as React from "react";
import { useInstrumentTelemetry } from "@shift9/motion";
import { cn } from "./cn";

/* Zero-padded 3-digit cell, matching the frame's "X:094 · Y:012" grammar. */
const pad3 = (n: number) =>
  String(Math.max(0, Math.min(999, Math.round(n)))).padStart(3, "0");

export interface TelemetryRailProps {
  /** add the one-time boot fade-in (POWER-ON) to the readout cluster */
  boot?: boolean;
  className?: string;
}

/**
 * TelemetryRail — turns the GridFrame's decorative axis labels into a real,
 * live readout: true cursor grid-coordinates, scroll depth, the active
 * section, viewport size, a smoothed FPS gauge, and a 1Hz SYNC blink. A 1px
 * signal trace rides the frame's left edge tracking scroll depth, and the
 * corner ticks pulse each time a new section locks in.
 *
 * It subscribes to the single shared `useInstrumentTelemetry` loop and writes
 * straight to the DOM (textContent / transform) — React never re-renders on
 * the hot path. Lives inside GridFrame's aria-hidden, pointer-events-none
 * fixed overlay, so it is purely decorative chrome that never touches content.
 */
export function TelemetryRail({ boot, className }: TelemetryRailProps) {
  const { subscribe, reduced } = useInstrumentTelemetry();

  const coordRef = React.useRef<HTMLSpanElement>(null);
  const scrlRef = React.useRef<HTMLSpanElement>(null);
  const sectRef = React.useRef<HTMLSpanElement>(null);
  const viewRef = React.useRef<HTMLSpanElement>(null);
  const fpsRef = React.useRef<HTMLSpanElement>(null);
  const traceRef = React.useRef<HTMLSpanElement>(null);
  const lastSection = React.useRef<string>("");
  const lastFpsWrite = React.useRef<number>(0);

  React.useEffect(() => {
    const pulseTicks = () => {
      if (reduced) return;
      const ticks =
        document.querySelectorAll<HTMLElement>("[data-s9-tick]");
      ticks.forEach((t) =>
        t.animate(
          [
            { filter: "brightness(1)" },
            { filter: "brightness(2.6)", offset: 0.18 },
            { filter: "brightness(1)" },
          ],
          { duration: 480, easing: "cubic-bezier(.22,1,.36,1)" },
        ),
      );
    };

    return subscribe((s) => {
      if (coordRef.current)
        coordRef.current.textContent = `X:${pad3(s.gx)} · Y:${pad3(s.gy)}`;
      if (scrlRef.current)
        scrlRef.current.textContent = `${String(
          Math.round(s.scroll * 100),
        ).padStart(3, " ")}%`;
      if (sectRef.current) sectRef.current.textContent = s.section || "—";
      if (viewRef.current)
        viewRef.current.textContent = `${s.vw}×${s.vh}`;
      // FPS is jittery — refresh the digits ~4×/sec, not every frame.
      if (fpsRef.current && s.fps) {
        const now = s.fps; // value already smoothed by the hook
        if (performance.now() - lastFpsWrite.current > 240) {
          fpsRef.current.textContent = `${now}FPS`;
          lastFpsWrite.current = performance.now();
        }
      }
      if (traceRef.current)
        traceRef.current.style.transform = `scaleY(${s.scroll.toFixed(4)})`;

      if (s.section !== lastSection.current) {
        lastSection.current = s.section;
        pulseTicks();
      }
    });
  }, [subscribe, reduced]);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0",
        boot && "s9-boot-rail",
        className,
      )}
    >
      {/* Scroll-depth trace — rides the frame's left inner edge. Starts at
          scaleY(0) (identical on server + client to avoid a hydration
          mismatch); the shared loop drives it from scroll depth, including
          event-driven under reduced motion. */}
      <span
        ref={traceRef}
        className="absolute left-3 top-3 bottom-3 w-px origin-top sm:left-5 sm:top-5 sm:bottom-5"
        style={{
          background:
            "color-mix(in oklab, var(--s9-signal) 60%, transparent)",
          transform: "scaleY(0)",
        }}
      />

      {/* Live readout cluster — fills the otherwise-empty bottom-left margin.
          Segments drop off on smaller viewports so the row never overflows. */}
      <div className="absolute bottom-1 left-4 flex items-center gap-x-2 font-mono text-[10px] uppercase tracking-[0.2em] tabular-nums text-muted sm:bottom-2.5 sm:left-7">
        <span ref={coordRef} suppressHydrationWarning>
          X:000 · Y:000
        </span>
        <span className="text-line-2">·</span>
        <span ref={scrlRef} suppressHydrationWarning>
          {"  0%"}
        </span>
        <span className="hidden text-line-2 sm:inline">·</span>
        <span
          ref={sectRef}
          className="hidden text-signal sm:inline"
          suppressHydrationWarning
        >
          —
        </span>
        <span className="hidden text-line-2 md:inline">·</span>
        <span ref={fpsRef} className="hidden md:inline" suppressHydrationWarning>
          60FPS
        </span>
        <span className="hidden text-line-2 lg:inline">·</span>
        <span ref={viewRef} className="hidden lg:inline" suppressHydrationWarning>
          0×0
        </span>
        <span className="ml-0.5 inline-flex items-center gap-1">
          {/* s9-sync is always applied (stable SSR/CSR markup). The global
              reduced-motion contract collapses the blink to a steady dot. */}
          <span className="s9-sync text-signal" aria-hidden>
            ◇
          </span>
          <span className="hidden text-muted md:inline">sync</span>
        </span>
      </div>
    </div>
  );
}
