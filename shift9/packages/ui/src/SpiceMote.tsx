"use client";

import * as React from "react";
import { useReducedMotionSafe } from "@shift9/motion";
import { cn } from "./cn";

interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

/**
 * SpiceMote — the "just a pinch" cursor. As the pointer moves, fine motes of
 * spice (saffron → paprika → cream, read live from the theme tokens, so it
 * stays warm on Just a Pinch and would re-skin anywhere) spray from the
 * cursor and settle under a gentle gravity, drawn with additive blending so
 * overlapping dust glows like seasoning catching the light.
 *
 * Deliberately surface-specific: where the studio site wears a precision
 * crosshair console cursor, the product site gets a warm, tactile sprinkle —
 * and it keeps the native OS cursor (better for a product page) rather than
 * hiding it. Canvas2D, `pointer:fine` only, paused when idle or hidden, and
 * renders nothing under reduced motion.
 */
export function SpiceMote({ className }: { className?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotionSafe();

  React.useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches)
      return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Pull the spice palette straight from the live tokens.
    const cs = getComputedStyle(document.documentElement);
    const read = (v: string, fb: string) =>
      cs.getPropertyValue(v).trim() || fb;
    const SAFFRON = read("--s9-signal", "#f5a524");
    const PAPRIKA = read("--s9-pulse", "#e8633a");
    const CREAM = read("--s9-ink", "#f6ead8");
    const pick = () => {
      const r = Math.random();
      return r < 0.62 ? SAFFRON : r < 0.88 ? PAPRIKA : CREAM;
    };

    let W = 0;
    let H = 0;
    const resize = () => {
      W = canvas.width = Math.floor(window.innerWidth * dpr);
      H = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    };
    resize();

    const motes: Mote[] = [];
    const MAX = 280;
    let lastX = 0;
    let lastY = 0;
    let primed = false;
    let lastEmit = 0;
    let raf = 0;
    let prev = performance.now();

    const onMove = (e: PointerEvent) => {
      const x = e.clientX * dpr;
      const y = e.clientY * dpr;
      if (!primed) {
        lastX = x;
        lastY = y;
        primed = true;
      }
      const dx = x - lastX;
      const dy = y - lastY;
      const speed = Math.hypot(dx, dy);
      lastX = x;
      lastY = y;

      const now = performance.now();
      if (now - lastEmit < 16) return;
      lastEmit = now;

      // Faster movement throws a bigger pinch.
      const count = Math.min(3, 1 + Math.floor(speed / (15 * dpr)));
      for (let i = 0; i < count && motes.length < MAX; i++) {
        motes.push({
          x: x + (Math.random() - 0.5) * 7 * dpr,
          y: y + (Math.random() - 0.5) * 7 * dpr,
          vx: dx * 0.045 + (Math.random() - 0.5) * 0.55 * dpr,
          vy: dy * 0.02 + (Math.random() * 0.3 + 0.04) * dpr,
          life: 0,
          maxLife: 700 + Math.random() * 950,
          size: (0.7 + Math.random() * 1.7) * dpr,
          color: pick(),
        });
      }
      if (!raf) {
        prev = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    const loop = (t: number) => {
      const dt = Math.min(48, t - prev);
      prev = t;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      const gravity = 0.00019 * dpr;
      for (let i = motes.length - 1; i >= 0; i--) {
        const p = motes[i];
        if (!p) continue;
        p.life += dt;
        if (p.life >= p.maxLife) {
          motes.splice(i, 1);
          continue;
        }
        p.vy += gravity * dt;
        p.vx *= 0.985;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const k = p.life / p.maxLife;
        // quick fade-in, long fade-out
        const alpha = (1 - k) * (k < 0.12 ? k / 0.12 : 1) * 0.85;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - 0.3 * k), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      raf = motes.length ? requestAnimationFrame(loop) : 0;
    };

    const onVisibility = () => {
      if (document.hidden && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  // Always render the (transparent) canvas — never branch render output on
  // `reduced`, which is false-until-measured and would mismatch SSR (React
  // #418). The effect above no-ops under reduced motion, leaving it blank.
  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 z-[60]", className)}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
