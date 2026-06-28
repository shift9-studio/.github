import * as React from "react";
import { cn } from "./cn";
import { TelemetryRail } from "./TelemetryRail";
import { GridSweep, type SweepPalette } from "./GridSweep";

export interface GridFrameProps {
  label?: string;
  coord?: string;
  className?: string;
  /**
   * Bring the frame to life: a real telemetry readout (live coords, scroll
   * depth, active section, viewport, FPS, SYNC blink), a scroll trace on the
   * edge, corner-tick pulses on section lock, and the phosphor sweep. Default
   * OFF — when false the frame renders byte-for-byte as it always has.
   */
  live?: boolean;
  /** One-time POWER-ON boot when the frame mounts. Implies `live`. */
  boot?: boolean;
  /** Re-skin the phosphor sweep per surface (e.g. Just-a-Pinch's warm palette). */
  sweepPalette?: SweepPalette;
}

/* Per-tick boot stagger — corner ticks strike in sequence. */
const TICK_DELAYS = ["0ms", "90ms", "180ms", "270ms"];

/**
 * The brutalist coordinate scaffold — a fixed, non-interactive overlay with an
 * inset hairline, corner registration marks, and monospace axis labels. The
 * signature frame that wraps every page.
 *
 * Pass `live` to wake it up (see {@link GridFrameProps.live}); pass `boot` for
 * the one-time power-on. Both are additive and fully reduced-motion gated —
 * the resting look is identical to the static frame.
 */
export function GridFrame({
  label = "SHIFT-9 // INSTRUMENT",
  coord = "X:094 · Y:012",
  className,
  live = false,
  boot = false,
  sweepPalette,
}: GridFrameProps) {
  const isLive = live || boot;

  return (
    <div
      data-s9-frame
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 z-40", className)}
    >
      <div
        data-s9-border
        className={cn(
          "absolute inset-3 border border-line sm:inset-5",
          boot && "s9-boot-frame",
        )}
      />

      {/* corner registration marks */}
      <span
        data-s9-tick
        style={boot ? { animationDelay: TICK_DELAYS[0] } : undefined}
        className={cn(
          "absolute left-2.5 top-2.5 h-2 w-2 border-l border-t border-signal sm:left-[1.1rem] sm:top-[1.1rem]",
          boot && "s9-boot-tick",
        )}
      />
      <span
        data-s9-tick
        style={boot ? { animationDelay: TICK_DELAYS[1] } : undefined}
        className={cn(
          "absolute right-2.5 top-2.5 h-2 w-2 border-r border-t border-signal sm:right-[1.1rem] sm:top-[1.1rem]",
          boot && "s9-boot-tick",
        )}
      />
      <span
        data-s9-tick
        style={boot ? { animationDelay: TICK_DELAYS[2] } : undefined}
        className={cn(
          "absolute bottom-2.5 left-2.5 h-2 w-2 border-b border-l border-signal sm:bottom-[1.1rem] sm:left-[1.1rem]",
          boot && "s9-boot-tick",
        )}
      />
      <span
        data-s9-tick
        style={boot ? { animationDelay: TICK_DELAYS[3] } : undefined}
        className={cn(
          "absolute bottom-2.5 right-2.5 h-2 w-2 border-b border-r border-signal sm:bottom-[1.1rem] sm:right-[1.1rem]",
          boot && "s9-boot-tick",
        )}
      />

      {/* center hairline guide (wide screens) */}
      <span
        className={cn(
          "absolute inset-y-5 left-1/2 hidden w-px bg-line-2 lg:block",
          boot && "s9-boot-center",
        )}
      />

      {/* mono axis labels */}
      <span className="absolute left-4 top-1 font-mono text-[10px] uppercase tracking-[0.3em] text-muted sm:left-7 sm:top-2.5">
        {label}
      </span>
      <span className="absolute bottom-1 right-4 font-mono text-[10px] uppercase tracking-[0.3em] text-muted sm:bottom-2.5 sm:right-7">
        {coord}
      </span>

      {/* ── live instrumentation (opt-in, reduced-motion gated) ── */}
      {isLive && (
        <>
          <GridSweep
            className="absolute inset-0 h-full w-full"
            palette={sweepPalette}
          />
          <TelemetryRail boot={boot} />
        </>
      )}
    </div>
  );
}
