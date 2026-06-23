import * as React from "react";
import { cn } from "./cn";

export interface GridFrameProps {
  label?: string;
  coord?: string;
  className?: string;
}

/**
 * The brutalist coordinate scaffold — a fixed, non-interactive overlay
 * with an inset hairline, corner registration marks, and monospace axis
 * labels. The signature frame that wraps every page.
 */
export function GridFrame({
  label = "SHIFT-9 // INSTRUMENT",
  coord = "X:094 · Y:012",
  className,
}: GridFrameProps) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 z-40", className)}
    >
      <div className="absolute inset-3 border border-line sm:inset-5" />

      {/* corner registration marks */}
      <span className="absolute left-2.5 top-2.5 h-2 w-2 border-l border-t border-signal sm:left-[1.1rem] sm:top-[1.1rem]" />
      <span className="absolute right-2.5 top-2.5 h-2 w-2 border-r border-t border-signal sm:right-[1.1rem] sm:top-[1.1rem]" />
      <span className="absolute bottom-2.5 left-2.5 h-2 w-2 border-b border-l border-signal sm:bottom-[1.1rem] sm:left-[1.1rem]" />
      <span className="absolute bottom-2.5 right-2.5 h-2 w-2 border-b border-r border-signal sm:bottom-[1.1rem] sm:right-[1.1rem]" />

      {/* center hairline guide (wide screens) */}
      <span className="absolute inset-y-5 left-1/2 hidden w-px bg-line-2 lg:block" />

      {/* mono axis labels */}
      <span className="absolute left-4 top-1 font-mono text-[10px] uppercase tracking-[0.3em] text-muted sm:left-7 sm:top-2.5">
        {label}
      </span>
      <span className="absolute bottom-1 right-4 font-mono text-[10px] uppercase tracking-[0.3em] text-muted sm:bottom-2.5 sm:right-7">
        {coord}
      </span>
    </div>
  );
}
