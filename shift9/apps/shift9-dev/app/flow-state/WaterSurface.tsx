"use client";

import { useEffect, useRef } from "react";
import s from "./flow-state.module.css";

type Point = { x: number; y: number; active: boolean };

export function WaterSurface() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;
    const surface = canvas;
    const drawing = context;
    const tokens = getComputedStyle(document.documentElement);
    const pearl = tokens.getPropertyValue("--s9-pearl").trim();
    const verdant = tokens.getPropertyValue("--s9-verdant").trim();
    const pulse = tokens.getPropertyValue("--s9-pulse").trim();
    const warmFoil = tokens.getPropertyValue("--s9-holofoil-fallback").trim();
    const mix = (color: string, amount: number) =>
      `color-mix(in srgb, ${color} ${amount}%, transparent)`;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = window.matchMedia("(pointer: fine)");
    const pointer: Point = { x: 0.5, y: 0.42, active: false };
    let frame = 0;
    let width = 0;
    let height = 0;
    let lastPaint = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      surface.width = Math.round(width * dpr);
      surface.height = Math.round(height * dpr);
      surface.style.width = `${width}px`;
      surface.style.height = `${height}px`;
      drawing.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (motionQuery.matches) paint(0);
    }

    function paint(time: number) {
      drawing.clearRect(0, 0, width, height);

      const reflection = drawing.createRadialGradient(
        width * (pointer.active ? pointer.x : 0.62),
        height * (pointer.active ? pointer.y : 0.28),
        0,
        width * (pointer.active ? pointer.x : 0.62),
        height * (pointer.active ? pointer.y : 0.28),
        Math.max(width, height) * 0.72,
      );
      reflection.addColorStop(0, mix(pearl, 16));
      reflection.addColorStop(0.3, mix(verdant, 5));
      reflection.addColorStop(0.7, mix(pulse, 4));
      reflection.addColorStop(1, "transparent");
      drawing.fillStyle = reflection;
      drawing.fillRect(0, 0, width, height);

      drawing.globalCompositeOperation = "screen";
      const seconds = time * 0.001;
      for (let layer = 0; layer < 14; layer += 1) {
        const baseY = ((layer + 0.7) / 14) * height;
        const amplitude = 8 + (layer % 4) * 4;
        const frequency = 0.006 + (layer % 3) * 0.0014;
        drawing.beginPath();

        for (let x = -16; x <= width + 16; x += 12) {
          const dx = x - pointer.x * width;
          const falloff = pointer.active
            ? Math.exp(-(dx * dx) / Math.max(1, width * width * 0.055))
            : 0;
          const ripple = falloff * Math.sin(Math.abs(dx) * 0.045 - seconds * 3.2) * 13;
          const y =
            baseY +
            Math.sin(x * frequency + seconds * (0.25 + layer * 0.018) + layer) * amplitude +
            Math.sin(x * 0.012 - seconds * 0.18 + layer * 0.7) * 3 +
            ripple;
          if (x === -16) drawing.moveTo(x, y);
          else drawing.lineTo(x, y);
        }

        const warm = layer % 5 === 0;
        const green = layer % 7 === 0;
        drawing.strokeStyle = warm
          ? mix(warmFoil, 14)
          : green
            ? mix(verdant, 12)
            : mix(pearl, 6 + (layer % 3) * 2);
        drawing.lineWidth = layer % 4 === 0 ? 1.15 : 0.7;
        drawing.stroke();
      }
      drawing.globalCompositeOperation = "source-over";
    }

    function animate(time: number) {
      if (time - lastPaint > 32) {
        paint(time);
        lastPaint = time;
      }
      if (!motionQuery.matches) frame = window.requestAnimationFrame(animate);
    }

    function start() {
      window.cancelAnimationFrame(frame);
      paint(0);
      if (!motionQuery.matches) frame = window.requestAnimationFrame(animate);
    }

    function move(event: PointerEvent) {
      pointer.x = event.clientX / Math.max(1, width);
      pointer.y = event.clientY / Math.max(1, height);
      pointer.active = true;
      if (motionQuery.matches) paint(0);
    }

    function leave() {
      pointer.active = false;
    }

    let interactionEnabled = false;
    function syncInteraction() {
      const shouldEnable = pointerQuery.matches && !motionQuery.matches;
      if (shouldEnable === interactionEnabled) return;
      interactionEnabled = shouldEnable;
      if (shouldEnable) {
        window.addEventListener("pointermove", move, { passive: true });
        document.documentElement.addEventListener("pointerleave", leave);
      } else {
        window.removeEventListener("pointermove", move);
        document.documentElement.removeEventListener("pointerleave", leave);
        pointer.active = false;
        paint(0);
      }
    }

    function syncPreferences() {
      start();
      syncInteraction();
    }

    resize();
    start();
    syncInteraction();
    window.addEventListener("resize", resize);
    motionQuery.addEventListener("change", syncPreferences);
    pointerQuery.addEventListener("change", syncInteraction);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      motionQuery.removeEventListener("change", syncPreferences);
      pointerQuery.removeEventListener("change", syncInteraction);
    };
  }, []);

  return <canvas ref={canvasRef} className={s.waterSurface} aria-hidden="true" />;
}
