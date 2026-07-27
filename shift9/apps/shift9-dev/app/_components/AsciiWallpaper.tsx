"use client";

/* ────────────────────────────────────────────────────────────────────────
   ASCII WALLPAPER — the live desktop background behind the studio front door.

   Every glyph, every colour and every direction of travel is derived from the
   REAL brand art (profile/assets/s9-banner-still.jpg + s9-icon.png) by
   scripts/build-ascii-art.py. Nothing here is a hand-drawn lookalike: the
   SHIFT-9 wordmark you can read in the field IS the banner, resampled onto a
   170x57 character grid.

   It genuinely moves. A light pulse travels across the field along the
   luminance gradient baked into `flow`, so the sweep follows the banner's own
   streaks rather than shimmering at random. Cells brighten, step up the ASCII
   ramp, and shift up the 16-colour palette as the wave passes.

   Contract:
   - Decorative. aria-hidden, pointer-events: none. The desktop above it is the
     real content.
   - prefers-reduced-motion renders ONE complete static frame of the artwork —
     the full wordmark, full palette, fully legible. Not a paused half-state.
   - Draws through a single rAF loop with per-cell diffing: only cells whose
     glyph or tone actually changed are repainted, so the steady-state cost is
     the moving band, not the whole grid.
   - Coarse pointers / narrow viewports render at half grid density and a lower
     frame cap. The art is identical, just cheaper.
   ──────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import { ASCII_RAMP, BANNER_ASCII } from "./ascii-art-data";

const TAU = Math.PI * 2;

/* Motion constants live here rather than as magic numbers in the loop. */
const SWEEP_PERIOD_MS = 9000; // one full pass of the light across the field
const BREATH_PERIOD_MS = 5200; // slow idle shimmer so it is alive at rest
const BAND_WIDTH = 0.16; // width of the travelling pulse, in field widths
/* The field only repaints cells whose glyph or tone actually changed, so the
   steady-state cost is the moving band and not the grid — which means the
   30fps cap was a ceiling on smoothness rather than a saving. Raised to 60,
   with touch devices at 30 rather than 20. */
const FRAME_MS_FINE = 1000 / 60;
const FRAME_MS_COARSE = 1000 / 30;

type Cell = { char: number; tone: number };

/* `ink` maps the artwork onto a LIGHT surface: the palette is flipped so bright
   source pixels become dark ink. Without it the white wordmark would vanish
   into the desktop. Set false to draw the field on a dark surface as-is. */
export function AsciiWallpaper({
  className,
  ink = true,
}: {
  className?: string;
  ink?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const src = BANNER_ASCII;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const step = fine ? 1 : 2; // half density on touch / small screens
    const cols = Math.ceil(src.cols / step);
    const rows = Math.ceil(src.rows / step);
    const frameMs = fine ? FRAME_MS_FINE : FRAME_MS_COARSE;

    /* Decode the generated strings once into flat typed arrays. */
    const baseChar = new Uint8Array(cols * rows);
    const baseTone = new Uint8Array(cols * rows);
    const flow = new Float32Array(cols * rows);
    for (let y = 0; y < rows; y++) {
      const gRow = src.grid[y * step] ?? "";
      const tRow = src.tone[y * step] ?? "";
      const fRow = src.flow[y * step] ?? "";
      for (let x = 0; x < cols; x++) {
        const sx = x * step;
        const i = y * cols + x;
        baseChar[i] = Math.max(0, ASCII_RAMP.indexOf(gRow[sx] ?? " "));
        baseTone[i] = parseInt(tRow[sx] ?? "0", 16) || 0;
        flow[i] = (parseInt(fRow[sx] ?? "0", 16) / 16) * TAU;
      }
    }

    const maxChar = ASCII_RAMP.length - 1;
    const maxTone = src.palette.length - 1;

    /* Per-cell glyph atlas: every ramp character in every palette colour,
       rendered once. The loop then only ever does drawImage. */
    let atlas: HTMLCanvasElement | null = null;
    let cellW = 0;
    let offX = 0;
    let offY = 0;
    let cellH = 0;
    let dpr = 1;
    let prev: Cell[] = [];

    const buildAtlas = () => {
      const aw = Math.ceil(cellW * dpr);
      const ah = Math.ceil(cellH * dpr);
      const a = document.createElement("canvas");
      a.width = aw * ASCII_RAMP.length;
      a.height = ah * src.palette.length;
      const actx = a.getContext("2d");
      if (!actx) return null;
      actx.textBaseline = "middle";
      actx.textAlign = "center";
      /* A monospace advance is ~0.6em, so the glyph has to be sized off the
         cell WIDTH or neighbouring characters overlap and the field smears
         into a solid mass instead of reading as text. */
      const fontPx = Math.max(4, Math.min(cellH * dpr * 0.98, (cellW * dpr) / 0.6));
      actx.font = `${fontPx}px ui-monospace, "SF Mono", Menlo, "Courier New", monospace`;
      for (let t = 0; t < src.palette.length; t++) {
        actx.fillStyle = src.palette[t] ?? "#000000";
        for (let c = 0; c < ASCII_RAMP.length; c++) {
          actx.fillText(ASCII_RAMP[c] ?? " ", c * aw + aw / 2, t * ah + ah / 2);
        }
      }
      return a;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      /* The grid used to be stretched to the container on both axes
         independently. The artwork is 170x57 — nearly 3:1 — and the desktop
         it sits behind is closer to 1.6:1, so every glyph was being pulled to
         roughly twice its height and the wordmark read as a crop of itself
         rather than as the banner. One cell size for both axes fixes the
         proportions; the field is then centred in whatever space is left, so
         the whole banner is on screen with its own aspect intact. */
      const cell = Math.min(rect.width / cols, rect.height / rows);
      cellW = cell;
      cellH = cell;
      offX = (rect.width - cell * cols) / 2;
      offY = (rect.height - cell * rows) / 2;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      atlas = buildAtlas();
      prev = [];
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    /* One frame of the field at time `t` (ms). Repaints only changed cells. */
    const paint = (t: number) => {
      if (!atlas) return;
      const aw = Math.ceil(cellW * dpr);
      const ah = Math.ceil(cellH * dpr);
      const sweep = (t % SWEEP_PERIOD_MS) / SWEEP_PERIOD_MS;
      const breath = Math.sin((t / BREATH_PERIOD_MS) * TAU) * 0.5 + 0.5;
      const full = prev.length === 0;
      if (full) prev = new Array<Cell>(cols * rows);

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const base = baseChar[i] ?? 0;

          /* Distance of this cell from the travelling wavefront, bent by the
             cell's own gradient direction so the pulse rides the real streaks. */
          const bend = Math.cos(flow[i] ?? 0) * 0.08;
          let d = x / cols + bend - sweep;
          d -= Math.round(d); // wrap to -0.5..0.5
          const pulse = Math.exp(-(d * d) / (BAND_WIDTH * BAND_WIDTH));

          /* The wave travels THROUGH the artwork, never over it: a cell the
             banner left black stays black, so the wordmark keeps its shape and
             the negative space never fills in. */
          const shimmer = breath * 0.35;
          const lift = base === 0 ? 0 : pulse * 2.2 + shimmer;
          const char = Math.min(maxChar, Math.round(base + lift));

          /* Ink weight tracks glyph density, not the source pixel's own colour.
             Tying the two together is what makes the field read as one image:
             a dense glyph is dark ink, a sparse one is pale, so the wordmark
             separates from the streaks instead of every cell landing at a
             similar weight. baseTone only nudges the hue within that band. */
          const density = char / maxChar;
          const hue = ((baseTone[i] ?? 0) / maxTone - 0.5) * 1.5;
          const weight = ink ? 1 - density : density;
          const tone = Math.max(0, Math.min(maxTone, Math.round((weight + hue * 0.06) * maxTone)));

          const was = prev[i];
          if (!full && was && was.char === char && was.tone === tone) continue;
          prev[i] = { char, tone };

          const dx = Math.round((offX + x * cellW) * dpr);
          const dy = Math.round((offY + y * cellH) * dpr);
          ctx.clearRect(dx, dy, aw, ah);
          if (char === 0) continue; // space — leave it cleared
          ctx.drawImage(atlas, char * aw, tone * ah, aw, ah, dx, dy, aw, ah);
        }
      }
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let last = 0;

    /* Static state: one complete frame with the pulse parked off the field, so
       the whole wordmark reads at its natural luminance. */
    const paintStatic = () => {
      prev = [];
      paint(SWEEP_PERIOD_MS * 0.5);
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < frameMs) return;
      last = now;
      paint(now);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      resize();
      if (reduced.matches) paintStatic();
      else raf = requestAnimationFrame(loop);
    };

    start();

    const ro = new ResizeObserver(() => start());
    ro.observe(canvas);
    reduced.addEventListener("change", start);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      reduced.removeEventListener("change", start);
    };
  }, [ink]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
