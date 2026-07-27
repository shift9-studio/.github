"use client";

/* ────────────────────────────────────────────────────────────────────────
   THE SINKHOLE — travel from the desktop into the studio.

   Fires when the shift9.dev icon is opened. A hole opens where the icon is
   and the desktop's own wallpaper — the SHIFT-9 banner resampled to a
   character grid by scripts/build-ascii-art.py — falls into it. Cyan light
   comes up through the hole as it widens, the same light that sits behind the
   seam on the front door, so the way out of the studio rhymes with the way
   in. When the hole has the frame, the studio is already there.

   ── What replaced what, and why ──────────────────────────────────────────
   The first version flew stacked copies of the plane past the camera toward a
   vanishing point. It was a corridor, and a corridor is a thing you travel
   along — but nothing on the desktop was travelling. The icon was a door in
   the floor, and the honest gesture for a door in the floor is falling
   through it.

   Not a whirlpool. A gravity well: rings accelerate straight in with no
   rotation, the near ones going first and fastest, so the field stretches as
   it drains rather than swirling. A spiral would have read as a screensaver.

   ── How it is drawn ──────────────────────────────────────────────────────
   The plane is rasterised once. Each frame, the field is cut into concentric
   bands around the hole; a band whose content started at radius r is drawn
   scaled about the hole by s, which puts it at r·s, and clipped to the annulus
   it now occupies. s falls faster for the inner bands, so the gaps between
   bands compress as they approach — which is the stretch. One clipped
   drawImage per band, and the bands are the only thing in the loop.

   ── Contract ─────────────────────────────────────────────────────────────
   - Decorative. aria-hidden, pointer-events: none. Navigation is the real
     event; this only covers the time it takes.
   - prefers-reduced-motion never mounts this at all. The caller navigates
     immediately instead — a clean cut, not a paused half-state.
   - It draws in the wallpaper's slot, under the desktop chrome, because only
     the wallpaper falls. The folders and the taskbar stay where they are and
     are taken by the closing layer at the end.
   - Colours and duration come from @shift9/theme custom properties read off
     the document, so it follows the palette and hardcodes nothing.
   ──────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import { ASCII_RAMP, BANNER_ASCII } from "./ascii-art-data";

/* Concentric bands the field is cut into. Enough that the compression between
   neighbours reads as a continuous stretch rather than as steps; past about
   twenty the extra bands are narrower than the glyphs they carry and buy
   nothing but draw calls. */
const BANDS = 18;

/* How much later the outermost band starts falling than the innermost, as a
   fraction of the run. This is the whole gravity read: everything releasing at
   once is a zoom, and the edge lagging the centre is a well. */
const STAGGER = 0.55;

/* Cell sampling for the rasterised plane. Every other cell keeps the wordmark
   legible at a fraction of the fillText cost. */
const STEP = 2;

/* The rasterised plane's own width. It is only ever drawn at viewport scale or
   smaller, so this is all the detail the upscale can show. */
const PLANE_W = 820;

function cssVar(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name);
  return v.trim() || fallback;
}

function cssMs(name: string, fallback: number) {
  const raw = cssVar(name, "");
  if (!raw) return fallback;
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return fallback;
  return raw.endsWith("s") && !raw.endsWith("ms") ? n * 1000 : n;
}

/* Smooth 0→1 ramp. */
function smoothstep(a: number, b: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function AsciiTunnel({
  originX,
  originY,
  onDone,
  className,
}: {
  /* Viewport coordinates of the icon that was opened — where the hole opens.
     The desktop is `position: fixed; inset: 0`, so viewport coordinates and
     desktop-local coordinates are the same number. */
  originX: number;
  originY: number;
  onDone: () => void;
  /* Placed in the wallpaper's slot by the caller. */
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const closeRef = useRef<HTMLDivElement>(null);
  /* Held in a ref so a re-render can never fire the navigation twice. */
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    /* The click that opened this has already been cancelled, so every exit
       from here must still hand navigation on. Bailing silently would strand
       the visitor on the desktop with a dead icon. */
    const canvas = canvasRef.current;
    if (!canvas) {
      doneRef.current();
      return;
    }
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      doneRef.current();
      return;
    }

    const src = BANNER_ASCII;
    const cols = Math.ceil(src.cols / STEP);
    const rows = Math.ceil(src.rows / STEP);
    const planeH = Math.round((PLANE_W * rows) / cols);
    const maxChar = ASCII_RAMP.length - 1;

    const signal = cssVar("--s9-signal", "#22d3ee");
    const duration = cssMs("--s9-dur-tunnel", 1800);

    /* The falling field is drawn in the desktop's own text colour, at the
       wallpaper's own opacity, so the first frame of the fall is the wallpaper
       the visitor was already looking at. Anything else and the artwork
       changes colour at the moment it starts moving, which reads as a swap
       rather than as the same thing falling. */
    const ink = cssVar("--w-txt", "#1f2328");

    const plane = (() => {
      const c = document.createElement("canvas");
      c.width = PLANE_W;
      c.height = planeH;
      const g = c.getContext("2d");
      if (!g) return null;
      const cw = PLANE_W / cols;
      const ch = planeH / rows;
      g.textBaseline = "middle";
      g.textAlign = "center";
      /* Monospace advance is ~0.6em — size off cell WIDTH or glyphs overlap.
         Same constraint the wallpaper atlas hit. */
      const fontPx = Math.max(4, Math.min(ch * 0.98, cw / 0.6));
      g.font = `${fontPx}px ui-monospace, "SF Mono", Menlo, "Courier New", monospace`;
      g.fillStyle = ink;
      for (let y = 0; y < rows; y++) {
        const row = src.grid[y * STEP] ?? "";
        for (let x = 0; x < cols; x++) {
          const glyph = row[x * STEP] ?? " ";
          const idx = Math.max(0, ASCII_RAMP.indexOf(glyph));
          if (idx === 0) continue; // the artwork's negative space
          g.globalAlpha = 0.25 + (idx / maxChar) * 0.75;
          g.fillText(glyph, x * cw + cw / 2, y * ch + ch / 2);
        }
      }
      g.globalAlpha = 1;
      return c;
    })();

    if (!plane) {
      doneRef.current();
      return;
    }

    let dpr = 1;
    let vw = 0;
    let vh = 0;
    /* Where the plane sits on screen, matching the wallpaper's own placement:
       contained and centred, so the artwork the visitor sees is the artwork
       that falls. */
    let pw = 0;
    let ph = 0;
    let px = 0;
    let py = 0;
    /* Distance from the hole to the farthest corner — the outermost band. */
    let maxR = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      vw = rect.width;
      vh = rect.height;
      canvas.width = Math.round(vw * dpr);
      canvas.height = Math.round(vh * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      /* Nearest-neighbour: the source is a character grid, and letting the
         glyphs go blocky as they compress reads as resolution, not as blur. */
      ctx.imageSmoothingEnabled = false;

      const fit = Math.min(vw / PLANE_W, vh / planeH);
      pw = PLANE_W * fit;
      ph = planeH * fit;
      px = (vw - pw) / 2;
      py = (vh - ph) / 2;

      maxR = Math.max(
        Math.hypot(originX, originY),
        Math.hypot(vw - originX, originY),
        Math.hypot(originX, vh - originY),
        Math.hypot(vw - originX, vh - originY),
      );
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    let start = 0;
    let finished = false;
    const close = closeRef.current;

    const frame = (now: number) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / duration);

      ctx.clearRect(0, 0, vw, vh);

      /* ── The bands fall ──────────────────────────────────────────────────
         Outer bands release later; every band accelerates once released. A
         band's scale runs 1 → 0, and when it reaches 0 its content has been
         swallowed. */
      for (let k = BANDS - 1; k >= 0; k--) {
        const r0 = (k / BANDS) * maxR;
        const r1 = ((k + 1) / BANDS) * maxR;
        const q = (k + 0.5) / BANDS; // how far out this band sits, 0→1

        const released = (p - q * STAGGER) / Math.max(0.001, 1 - q * STAGGER);
        const lp = Math.max(0, Math.min(1, released));
        /* Squared, so it starts slowly and is moving hard by the time it
           reaches the hole. This is the "gravity" — nothing else about the
           motion is doing that job. */
        const s = 1 - lp * lp;
        if (s <= 0.004) continue;

        /* Dim as it is consumed, so bands vanish into the hole rather than
           shrinking to a hard point and popping out. */
        const a = smoothstep(0, 0.34, s);
        if (a <= 0.01) continue;

        ctx.save();
        /* Clip to where this band's content now is. */
        ctx.beginPath();
        ctx.arc(originX, originY, Math.max(0, r1 * s), 0, Math.PI * 2);
        if (r0 > 0) {
          ctx.arc(originX, originY, r0 * s, 0, Math.PI * 2, true);
        }
        ctx.clip("evenodd");

        ctx.globalAlpha = a;
        ctx.translate(originX, originY);
        ctx.scale(s, s);
        ctx.translate(-originX, -originY);
        ctx.drawImage(plane, px, py, pw, ph);
        ctx.restore();
      }

      /* ── The light through the hole ──────────────────────────────────────
         The innermost band has left by the time this is worth seeing, so the
         glow tracks the fall rather than the clock: it is the radius that has
         already been emptied. Screen-blended, so it only ever adds light and
         cannot muddy the artwork still falling around it. */
      const holeR = maxR * smoothstep(0, 0.86, p) * 0.92;
      if (holeR > 2) {
        const g = ctx.createRadialGradient(
          originX,
          originY,
          0,
          originX,
          originY,
          holeR,
        );
        g.addColorStop(0, signal);
        g.addColorStop(0.42, `color-mix(in oklab, ${signal} 42%, transparent)`);
        g.addColorStop(1, "transparent");
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.28 + 0.5 * smoothstep(0.1, 0.8, p);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(originX, originY, holeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      /* The closing layer sits above the chrome and takes the whole frame in
         the last beat: the light blooms out and settles to the studio's black,
         so the handoff is a fade between two blacks and not a cut. Driven from
         here rather than from a CSS animation so it can never drift out of
         step with the fall. */
      if (close) {
        const bloom = smoothstep(0.5, 0.82, p);
        const settle = smoothstep(0.74, 1, p);
        close.style.opacity = String(Math.max(bloom * 0.9, settle));
        close.style.background =
          settle > 0.001
            ? `color-mix(in oklab, #000 ${Math.round(settle * 100)}%, ${signal})`
            : signal;
      }

      if (p >= 1) {
        if (!finished) {
          finished = true;
          doneRef.current();
        }
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    /* rAF stops in a backgrounded tab. If someone opens the studio and
       switches away, the animation pauses and the loop never reaches the end —
       so a timer, which keeps running, guarantees navigation still happens. */
    const watchdog = window.setTimeout(() => {
      if (!finished) {
        finished = true;
        doneRef.current();
      }
    }, duration + 400);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(watchdog);
      ro.disconnect();
    };
  }, [originX, originY]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={className}
        aria-hidden="true"
        style={{ pointerEvents: "none" }}
      />
      <div
        ref={closeRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 9999,
          opacity: 0,
        }}
      />
    </>
  );
}
