"use client";

/* ────────────────────────────────────────────────────────────────────────
   THE WAVE FIELD

   A grid of vertical lines pushed around by 2D simplex noise, with a
   cursor that shoves the lines aside as it passes. Black ground, white
   stroke, nothing else — the colour on this page is the button.

   ── Why this is a canvas and not one SVG path per line ──────────────────
   The reference implementation builds a <path> element per line and
   rewrites its `d` attribute every frame. At the density the look needs
   that is 180 elements, each carrying a 110-point string, re-parsed by the
   SVG engine sixty times a second. Both renderers were built side by side
   at 1440x900 with identical geometry and timed over 40 frames: the SVG
   path ran a 28.4ms median frame (42.3ms at p95) — about 35fps, before any
   of the site's other work — and the canvas ran 2.6ms (4.5ms at p95). The
   benchmark drove both with the same cheap noise stand-in, so it isolates
   the cost of getting lines onto the screen, which is the part that
   differs. The picture is identical either way: 1px white lines are 1px
   white lines, and only the surface they land on changed.

   ── Density is a count, not a pixel gap ─────────────────────────────────
   The reference fixes the grid at 8px. That means a 4K display gets four
   times the lines of a 1440px one, which is both four times the work and a
   different picture — finer, busier, not the same design bigger. The site's
   root scale exists precisely so the design holds its proportions on any
   monitor, so the field follows the same rule: a fixed number of lines and
   points, spaced to land on 8px at the 1440px reference and to scale from
   there. Amplitudes and the cursor's reach scale with it, so the wave is
   the same wave on a laptop and on a 4K panel.

   ── Reduced motion ──────────────────────────────────────────────────────
   One frame, drawn at t=0, and no loop. A still field of noise-displaced
   lines is a finished image rather than a paused animation, which is the
   difference between degrading and breaking. The cursor dot is not mounted
   at all in that mode, and never on touch.
   ──────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import { createNoise2D } from "simplex-noise";

/* The reference viewport. Every spacing, amplitude and radius below is the
   value that looks right at this width and is scaled from it. */
const REF_W = 1440;

/* Line and point counts, not gaps: 1440 / 180 = 8px and 900 / 110 ≈ 8px,
   which is the reference grid, and it stays that grid at every size. */
const LINES = 180;
const POINTS = 110;

/* Overscan, so the field runs past the frame instead of ending inside it. */
const BLEED_X = 200;
const BLEED_Y = 30;

/* Resolution is adaptive, and this is the part worth reading.

   The point count is fixed, so the arithmetic costs the same at every size.
   What grows is rasterisation: 180 antialiased lines and a cleared frame
   cost whatever the canvas is big, and the line itself gets thicker with the
   design, which in software rasterisers is the expensive direction — a 2px
   antialiased line measured five times the cost of a 1px one.

   Rather than pick a fixed resolution, the field measures its own first
   second and steps the backing store down if it is not holding frame. On a
   machine with a GPU it never leaves full resolution. On a machine that
   cannot keep up it loses sharpness — and only sharpness. Density, motion
   and smoothness are the things a visitor actually perceives here, so they
   are the things that must not be spent.

   Honest limit on the numbers below: 60fps is verified at 1440x900. Above
   that it could not be measured in this environment, because a 4x4 canvas
   stretched to fill the window — drawing four pixels a frame — floors at
   30fps at 2560x1440 and 12fps at 3840x2160 on the software compositor
   here. That is the ceiling for any full-screen animated layer in that
   sandbox, so a larger measurement would say nothing about real hardware.
   The adaptive step exists precisely because that case cannot be tested. */
const QUALITY_STEPS = [1, 0.75, 0.55];

/* Even at full quality the buffer is bounded, or a 5K retina panel would ask
   for a 10240px canvas. */
const MAX_BACKING = 4096;

/* Frames slower than this mean the current resolution is too expensive. 20ms
   rather than 16.7 so an ordinary hiccup does not trigger a downgrade. */
const SLOW_FRAME_MS = 20;
const SAMPLE_FRAMES = 45;

/* Retina still gets extra pixels, up to the cap above. */
const MAX_DPR = 2;

type Point = {
  x: number;
  y: number;
  wx: number;
  wy: number;
  cx: number;
  cy: number;
  vx: number;
  vy: number;
};

type Props = {
  className?: string;
  /* CSS custom property names, resolved against the container — canvas
     needs a concrete colour, and this keeps the values in the token file
     rather than in this component. */
  strokeVar?: string;
  backgroundVar?: string;
  /* Diameter of the cursor dot, in rem, so it scales with the root ramp. */
  pointerSize?: number;
};

export function WaveField({
  className = "",
  strokeVar = "--s9-chalk",
  backgroundVar = "--s9-obsidian",
  pointerSize = 0.5,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const noise = createNoise2D();
    const css = getComputedStyle(host);
    const stroke = css.getPropertyValue(strokeVar).trim() || "#ffffff";
    const ground = css.getPropertyValue(backgroundVar).trim() || "#000000";

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* Coarse pointers get the field but not the push: there is no cursor to
       follow, and a touch that drags the lines fights the scroll. */
    const fine = window.matchMedia("(pointer: fine)").matches;

    let lines: Point[][] = [];
    /* Everything below works in BACKING pixels, not CSS pixels. That is the
       whole trick: the canvas is sized to the cap, the geometry is built for
       that size, and CSS stretches the finished bitmap over the element. A
       1px stroke stays a genuine 1px stroke in the buffer — which is the
       cheap case — and comes out proportionally thicker on a big monitor
       because the whole bitmap was scaled, exactly like the rest of the
       design. Asking the rasteriser for a 2px antialiased line instead costs
       five times as much for the same picture; that was measured. */
    let w = 0;
    let h = 0;
    /* CSS pixels per backing pixel, for translating pointer coordinates. */
    let toBacking = 1;
    let scale = 1;
    let raf = 0;
    let quality = 0;
    let samples: number[] = [];
    let lastFrame = 0;

    /* Cursor state. `s` is the smoothed position the field actually reads,
       `l` the previous raw sample, `vs` the smoothed speed, `a` the heading. */
    const m = { x: -9999, y: -9999, sx: -9999, sy: -9999, lx: 0, ly: 0, vs: 0, a: 0, set: false };

    function build() {
      const rect = host!.getBoundingClientRect();
      const cssW = Math.max(1, Math.round(rect.width));
      const cssH = Math.max(1, Math.round(rect.height));

      const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
      const q = QUALITY_STEPS[quality] ?? 1;
      const bs = Math.min(dpr * q, MAX_BACKING / cssW);
      w = Math.max(1, Math.round(cssW * bs));
      h = Math.max(1, Math.round(cssH * bs));
      toBacking = w / cssW;
      scale = w / REF_W;

      canvas!.width = w;
      canvas!.height = h;
      canvas!.style.width = `${cssW}px`;
      canvas!.style.height = `${cssH}px`;
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      /* `scale` is already in backing pixels, so this is a 1px line at the
         1440 reference and a proportionally thicker one on a larger design. */
      ctx!.lineWidth = scale;
      ctx!.strokeStyle = stroke;

      const bx = BLEED_X * scale;
      const by = BLEED_Y * scale;
      const xGap = (w + bx) / LINES;
      const yGap = (h + by) / POINTS;
      const x0 = (w - xGap * LINES) / 2;
      const y0 = (h - yGap * POINTS) / 2;

      lines = [];
      for (let i = 0; i < LINES; i++) {
        const col: Point[] = [];
        for (let j = 0; j < POINTS; j++) {
          col.push({
            x: x0 + xGap * i,
            y: y0 + yGap * j,
            wx: 0,
            wy: 0,
            cx: 0,
            cy: 0,
            vx: 0,
            vy: 0,
          });
        }
        lines.push(col);
      }
    }

    function step(t: number) {
      /* Noise frequency divides by scale so the wave keeps its shape in
         design space rather than getting finer on a bigger screen. */
      const fx = 0.003 / scale;
      const fy = 0.002 / scale;
      const ampX = 12 * scale;
      const ampY = 6 * scale;
      const clamp = 50 * scale;
      const reach = Math.max(175 * scale, m.vs);
      const push = 0.00035;
      const live = fine && m.set;

      for (let i = 0; i < lines.length; i++) {
        const col = lines[i];
        if (!col) continue;
        for (let j = 0; j < col.length; j++) {
          const p = col[j];
          if (!p) continue;

          const move = noise((p.x + t * 0.008) * fx, (p.y + t * 0.003) * fy) * 8;
          p.wx = Math.cos(move) * ampX;
          p.wy = Math.sin(move) * ampY;

          if (live) {
            const dx = p.x - m.sx;
            const dy = p.y - m.sy;
            const d = Math.hypot(dx, dy);
            if (d < reach) {
              const s = 1 - d / reach;
              const f = Math.cos(d * 0.001) * s;
              p.vx += Math.cos(m.a) * f * reach * m.vs * push;
              p.vy += Math.sin(m.a) * f * reach * m.vs * push;
            }
          }

          /* Spring home, then damp. Both run whether or not the cursor is
             live, so an abandoned field settles instead of freezing bent. */
          p.vx += -p.cx * 0.01;
          p.vy += -p.cy * 0.01;
          p.vx *= 0.95;
          p.vy *= 0.95;
          p.cx = Math.min(clamp, Math.max(-clamp, p.cx + p.vx));
          p.cy = Math.min(clamp, Math.max(-clamp, p.cy + p.vy));
        }
      }
    }

    /* One path, one stroke. Stroking each line separately is the same
       geometry and roughly ten times the calls. */
    function draw() {
      ctx!.fillStyle = ground;
      ctx!.fillRect(0, 0, w, h);
      ctx!.beginPath();

      for (let i = 0; i < lines.length; i++) {
        const col = lines[i];
        if (!col || col.length < 2) continue;
        const head = col[0];
        if (!head) continue;
        ctx!.moveTo(head.x + head.wx, head.y + head.wy);
        for (let j = 1; j < col.length; j++) {
          const p = col[j];
          if (!p) continue;
          ctx!.lineTo(p.x + p.wx + p.cx, p.y + p.wy + p.cy);
        }
      }

      ctx!.stroke();
    }

    function tick(t: number) {
      m.sx += (m.x - m.sx) * 0.1;
      m.sy += (m.y - m.sy) * 0.1;
      const dx = m.x - m.lx;
      const dy = m.y - m.ly;
      const d = Math.hypot(dx, dy);
      m.vs += (d - m.vs) * 0.1;
      m.vs = Math.min(100, m.vs);
      m.lx = m.x;
      m.ly = m.y;
      m.a = Math.atan2(dy, dx);

      if (dotRef.current && m.set) {
        /* The dot is a DOM element, so it goes back to CSS pixels. */
        const dx2 = m.sx / toBacking;
        const dy2 = m.sy / toBacking;
        dotRef.current.style.transform = `translate3d(${dx2}px, ${dy2}px, 0) translate(-50%, -50%)`;
      }

      step(t);
      draw();

      /* Sample the first stretch of frames, then decide once. Re-armed after
         each downgrade so a second step can follow if the first was not
         enough, and it stops sampling at the last step because there is
         nothing left to trade. */
      if (samples.length < SAMPLE_FRAMES && quality < QUALITY_STEPS.length - 1) {
        if (lastFrame) samples.push(t - lastFrame);
        if (samples.length === SAMPLE_FRAMES) {
          const sorted = samples.slice().sort((a, b) => a - b);
          const median = sorted[sorted.length >> 1] ?? 0;
          samples = [];
          if (median > SLOW_FRAME_MS) {
            quality += 1;
            build();
          }
        }
      }
      lastFrame = t;

      raf = requestAnimationFrame(tick);
    }

    function onPointer(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      const rect = host!.getBoundingClientRect();
      m.x = (e.clientX - rect.left) * toBacking;
      m.y = (e.clientY - rect.top) * toBacking;
      if (!m.set) {
        m.sx = m.lx = m.x;
        m.sy = m.ly = m.y;
        m.set = true;
        if (dotRef.current) dotRef.current.style.opacity = "1";
      }
    }

    function onResize() {
      build();
      if (still) {
        step(0);
        draw();
      }
    }

    /* A background nobody is looking at should not be burning a core. */
    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!still && !raf) {
        raf = requestAnimationFrame(tick);
      }
    }

    build();

    if (still) {
      step(0);
      draw();
    } else {
      raf = requestAnimationFrame(tick);
      document.addEventListener("visibilitychange", onVisibility);
      if (fine) window.addEventListener("pointermove", onPointer, { passive: true });
    }

    const ro = new ResizeObserver(onResize);
    ro.observe(host);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [strokeVar, backgroundVar]);

  return (
    <div
      ref={hostRef}
      className={className}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: `var(${backgroundVar})`,
        pointerEvents: "none",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
      <div
        ref={dotRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${pointerSize}rem`,
          height: `${pointerSize}rem`,
          borderRadius: "50%",
          background: `var(${strokeVar})`,
          opacity: 0,
          willChange: "transform",
        }}
      />
    </div>
  );
}
