import * as React from "react";
import { cn } from "./cn";

/* A grayscale fractal-noise tile, inlined as an SVG data URI so there's no
   network request and nothing to bundle. fractalNoise + saturate 0 = clean
   monochrome film grain. */
const NOISE_SVG = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'>` +
    `<filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/>` +
    `<feColorMatrix type='saturate' values='0'/></filter>` +
    `<rect width='100%' height='100%' filter='url(#g)'/></svg>`,
);

export interface GrainFieldProps {
  /** texture strength (0–1). Default 0.045 — present but never loud. */
  opacity?: number;
  className?: string;
}

/**
 * GrainField — a fixed, full-bleed film-grain / cookbook-paper texture. Blended
 * with `soft-light` over the warm surface, it lends an editorial, printed-recipe
 * tactility that a clean digital surface lacks — the kind of detail that reads
 * as "expensive" without announcing itself.
 *
 * The grain gently jitters via a stepped CSS animation; the global
 * reduced-motion contract freezes it to a still texture (the class is always
 * applied, so there's no SSR/CSR markup divergence). aria-hidden,
 * pointer-events-none, and so faint it can't affect text contrast.
 */
export function GrainField({ opacity = 0.045, className }: GrainFieldProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "s9-grain pointer-events-none fixed inset-0 z-[55] [mix-blend-mode:soft-light]",
        className,
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml,${NOISE_SVG}")`,
        backgroundSize: "140px 140px",
        backgroundRepeat: "repeat",
        opacity,
      }}
    />
  );
}
