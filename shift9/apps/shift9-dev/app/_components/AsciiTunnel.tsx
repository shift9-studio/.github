"use client";

/* ────────────────────────────────────────────────────────────────────────
   ASCII TUNNEL — travel from the desktop into the studio.

   Fires when the shift9.dev icon is opened. The desktop's own wallpaper art
   (the SHIFT-9 banner resampled to a character grid by
   scripts/build-ascii-art.py) is rebuilt as a flat plane and then flown
   through: copies of that plane recede to a vanishing point on the icon and
   rush outward past the viewer, tinted Signal → Pulse by depth, settling into
   the void as the studio takes over.

   This is code rather than a pre-rendered clip on purpose. It starts from the
   live desktop, so it has to inherit whatever is actually on screen — the
   active theme, the viewport size, the vanishing point of the icon that was
   clicked. A fixed video could match none of those and the seam would show.

   Contract:
   - Decorative. aria-hidden, pointer-events: none. Navigation is the real
     event; this only covers the time it takes.
   - prefers-reduced-motion never mounts this at all. The caller navigates
     immediately instead, so the reduced path is a clean cut, not a paused
     half-state.
   - Colours and duration come from @shift9/theme custom properties read off
     the document, so the tunnel follows the palette and never hardcodes it.
   - Two tinted planes are rasterised once on mount; each frame is a handful of
     drawImage calls, not a per-cell repaint.
   ──────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import { ASCII_RAMP, BANNER_ASCII } from "./ascii-art-data";

/* Depth planes in flight at once. Enough to read as continuous travel without
   the far end turning into a solid wash. */
const LAYERS = 16;

/* How much of the plane's width fills the frame when it is one unit deep.
   Below 1 the far planes sit inside the frame and the tunnel reads as a
   corridor rather than a wall rushing at you. */
const FOCAL = 0.42;

/* Cell sampling for the rasterised plane. The tunnel is in motion and scaled,
   so the full 170-column grid is more detail than survives; every other cell
   keeps the wordmark legible at a quarter of the fillText cost. */
const STEP = 2;

const PLANE_W = 1400;

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

/* Smooth 0→1 ramp, used for the fades at both ends of a plane's travel. */
function smoothstep(a: number, b: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function AsciiTunnel({
  originX,
  originY,
  onDone,
}: {
  /* Viewport coordinates of the icon that was opened — the vanishing point the
     tunnel departs from, before drifting to centre for the studio. */
  originX: number;
  originY: number;
  onDone: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /* Held in a ref so a re-render can never fire the navigation twice. */
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    /* The click that opened this has already been cancelled, so every exit from
       here must still hand navigation on. Bailing silently would strand the
       visitor on the desktop with a dead icon. */
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
    const pulse = cssVar("--s9-pulse", "#8b5cf6");
    const void_ = cssVar("--s9-void", "#0f172a");
    const duration = cssMs("--s9-dur-tunnel", 1100);

    /* Rasterise the character field once per tint. Cell alpha tracks glyph
       density so the wordmark keeps its shape at speed, exactly as it does in
       the wallpaper — dense glyph is solid, sparse glyph is faint. */
    const buildPlane = (colour: string) => {
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
      g.fillStyle = colour;
      for (let y = 0; y < rows; y++) {
        const row = src.grid[y * STEP] ?? "";
        for (let x = 0; x < cols; x++) {
          const ch_ = row[x * STEP] ?? " ";
          const idx = Math.max(0, ASCII_RAMP.indexOf(ch_));
          if (idx === 0) continue; // empty cell — the artwork's negative space
          g.globalAlpha = 0.25 + (idx / maxChar) * 0.75;
          g.fillText(ch_, x * cw + cw / 2, y * ch + ch / 2);
        }
      }
      g.globalAlpha = 1;
      return c;
    };

    const near = buildPlane(signal);
    const far = buildPlane(pulse);
    if (!near || !far) {
      doneRef.current();
      return;
    }

    let dpr = 1;
    let vw = 0;
    let vh = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      vw = rect.width;
      vh = rect.height;
      canvas.width = Math.round(vw * dpr);
      canvas.height = Math.round(vh * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    let start = 0;
    let finished = false;

    const frame = (now: number) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / duration);

      /* The vanishing point starts on the icon and eases to centre, so the
         travel begins where the click was and lands square for the studio. */
      const ease = smoothstep(0, 1, p);
      const cx = originX + (vw / 2 - originX) * ease;
      const cy = originY + (vh / 2 - originY) * ease;

      ctx.clearRect(0, 0, vw, vh);

      /* The void closes in over the whole move, so the tunnel arrives dark
         rather than cutting from a bright frame. */
      ctx.globalAlpha = smoothstep(0.15, 1, p);
      ctx.fillStyle = void_;
      ctx.fillRect(0, 0, vw, vh);

      ctx.globalCompositeOperation = "lighter";

      /* Accelerating travel: distance covered eases in, so the tunnel launches
         off the click rather than starting at full speed. */
      const travel = p * p * (3 - 2 * p) * 1.6;

      for (let k = 0; k < LAYERS; k++) {
        /* u is depth: 1 is far down the corridor, 0 is passing the camera. */
        const u = 1 - (((k / LAYERS + travel) % 1) + 1) % 1;
        if (u <= 0.02) continue;

        const scale = (FOCAL / u) * (vw / PLANE_W);
        const w = PLANE_W * scale;
        const h = planeH * scale;
        if (w < 2 || w > vw * 24) continue;

        /* Fade in as a plane appears at the far end, out as it sweeps past. */
        const a = smoothstep(1, 0.86, u) * smoothstep(0.04, 0.3, u) * (1 - p * 0.35);
        if (a <= 0.01) continue;

        /* Depth decides the tint: Pulse in the distance resolving to Signal as
           it arrives, so the corridor reads as the palette, front to back. */
        const mix = smoothstep(0.85, 0.1, u);
        const x = cx - w / 2;
        const y = cy - h / 2;

        ctx.globalAlpha = a * (1 - mix);
        ctx.drawImage(far, x, y, w, h);
        ctx.globalAlpha = a * mix;
        ctx.drawImage(near, x, y, w, h);
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;

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

    /* rAF stops in a backgrounded tab. If someone opens the studio and switches
       away, the animation pauses and the frame loop never reaches the end — so
       a timer, which keeps running, guarantees the navigation still happens. */
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
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}
