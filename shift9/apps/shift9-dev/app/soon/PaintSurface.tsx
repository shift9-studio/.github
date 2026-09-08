"use client";

import { createContext, Fragment, useContext, useEffect, useId, useRef, useState, type ReactNode, type PointerEvent } from "react";
import s from "./soon.module.css";

type Color = [number, number, number];
type Dab = { x: number; y: number; color: Color; width: number };
const PIGMENTS: Color[] = [[90, 223, 205], [184, 119, 226], [255, 100, 169]];
const colorText = (color: Color) => `rgb(${color.map(Math.round).join(" ")})`;
const mix = (a: Color, b: Color, amount: number): Color => a.map((v, i) => v * (1 - amount) + b[i]! * amount) as Color;
export const PaintReplyLayer = createContext<HTMLDivElement | null>(null);
const WipeContext = createContext<() => void>(() => {});
export function PaintResetProvider({ children }: { children: ReactNode }) {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (revision > 0) document.querySelector<HTMLButtonElement>("[data-wipe-paint]")?.focus({ preventScroll: true });
  }, [revision]);
  return <WipeContext.Provider value={() => setRevision(n => (n + 1) % 1000)}><Fragment key={revision}>{children}</Fragment></WipeContext.Provider>;
}
export default function PaintSurface({ children, className }: { children: ReactNode; className?: string }) {
  const [replyLayer, setReplyLayer] = useState<HTMLDivElement | null>(null);
  const [strokes, setStrokes] = useState<Dab[][]>([]);
  const wipe = useContext(WipeContext);
  const svg = useRef<SVGSVGElement>(null);
  const pigments = useRef<Color[]>(PIGMENTS);
  useEffect(() => {
    const image = new Image();
    let cancelled = false;
    image.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 16;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      context.filter = "saturate(2.4)";
      pigments.current = PIGMENTS.map((fallback, i) => {
        context.clearRect(0, 0, 16, 16);
        const cell = image.width / 3;
        context.drawImage(image, cell * (i + .4), image.height * .4, cell * .2, image.height * .2, 0, 0, 16, 16);
        const pixels = context.getImageData(0, 0, 16, 16).data;
        const sum: Color = [0, 0, 0];
        let weight = 0;
        for (let p = 0; p < pixels.length; p += 4) {
          const alpha = pixels[p + 3]! / 255;
          weight += alpha;
          for (let channel = 0; channel < 3; channel++) sum[channel]! += pixels[p + channel]! * alpha;
        }
        return weight ? sum.map(v => v / weight) as Color : fallback;
      });
    };
    image.src = "/experience/paint-splats.png";
    return () => { cancelled = true; image.onload = null; };
  }, []);
  const gradientId = useId().replace(/:/g, "");
  const active = useRef<{ id: number; points: Dab[]; color: Color; distance: number; existing: Dab[][] } | null>(null);
  const point = (e: PointerEvent<HTMLDivElement>) => {
    const matrix = svg.current?.getScreenCTM();
    const local = matrix ? new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse()) : new DOMPoint();
    return { x: Math.max(0, Math.min(1000, local.x)), y: Math.max(0, Math.min(700, local.y)) };
  };
  const wetColor = (e: PointerEvent<HTMLDivElement>): Color | undefined => {
    // Sample only the central wet pool, not the sprite's transparent corners.
    const pools = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[data-flavor]"));
    for (const pool of pools.reverse()) {
      const r = pool.getBoundingClientRect();
      if (!r.width || !r.height || Number(getComputedStyle(pool).opacity) < .1) continue;
      const dx = (e.clientX - r.left - r.width / 2) / (r.width * .3);
      const dy = (e.clientY - r.top - r.height / 2) / (r.height * .26);
      if (dx * dx + dy * dy <= 1) return pigments.current[Number(pool.dataset.flavor)];
    }
  };
  const trailColor = (p: { x: number; y: number }, trails: Dab[][]): Color | undefined => {
    for (const trail of [...trails].reverse()) {
      for (let i = trail.length - 1; i > 0; i--) {
        const a = trail[i - 1]!, b = trail[i]!;
        const dx = b.x - a.x, dy = b.y - a.y;
        const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
        if (Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t) < b.width / 2) return mix(a.color, b.color, t);
      }
    }
  };
  return <div className={`${className ?? ""} ${s.paintSurface}`} data-smeared={strokes.length > 0 || undefined}
    onPointerDown={e => {
      if (e.button !== 0) return;
      const p = point(e);
      const color = wetColor(e) ?? trailColor(p, strokes);
      if (!color) return;
      active.current = { id: e.pointerId, points: [{ ...p, color, width: 85 }], color, distance: 0, existing: strokes };
    }}
    onPointerMove={e => {
      const drag = active.current;
      if (!drag || drag.id !== e.pointerId || !e.buttons) return;
      const next = point(e), last = drag.points[drag.points.length - 1]!;
      const distance = Math.hypot(next.x - last.x, next.y - last.y);
      if (distance < 4) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      const pickedUp = wetColor(e) ?? trailColor(next, drag.existing);
      if (pickedUp) drag.color = mix(drag.color, pickedUp, Math.min(.32, distance / 80));
      drag.distance += distance;
      const width = Math.max(28, 85 - drag.distance * .05) + Math.sin(drag.distance * .08) * 5;
      const firstMove = drag.points.length === 1;
      // Thin the history without dropping the origin: long smears stay attached.
      if (drag.points.length >= 80) drag.points = drag.points.filter((_, i) => i % 2 === 0);
      drag.points = [...drag.points, { ...next, color: [...drag.color] as Color, width }];
      setStrokes(previous => firstMove ? [...previous.slice(-7), drag.points] : [...previous.slice(0, -1), drag.points]);
    }}
    onPointerUp={() => { active.current = null; }} onPointerCancel={() => { active.current = null; }}>
    <PaintReplyLayer.Provider value={replyLayer}>{children}</PaintReplyLayer.Provider>
    <div ref={setReplyLayer} className={s.replyLayer} />
    <svg ref={svg} className={s.rainbowGoop} viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true">
      <defs><filter id={`${gradientId}-wet`} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency=".12" numOctaves="2" seed="9" result="grain"/>
        <feDisplacementMap in="SourceGraphic" in2="grain" scale="4" xChannelSelector="R" yChannelSelector="G" result="ragged"/>
        <feColorMatrix in="grain" type="saturate" values="0"/>
        <feComponentTransfer><feFuncA type="linear" slope=".12"/></feComponentTransfer>
        <feComposite in2="ragged" operator="in" result="texture"/>
        <feBlend in="ragged" in2="texture" mode="soft-light"/>
      </filter></defs>
      <g filter={`url(#${gradientId}-wet)`}>
      {strokes.map((stroke, i) => <g key={i}>{stroke.slice(1).map((b, j) => {
        const a = stroke[j]!;
        const id = `${gradientId}-${i}-${j}`;
        const path = `M${a.x} ${a.y} L${b.x} ${b.y}`;
        return <g key={j}>
          <defs><linearGradient id={id} gradientUnits="userSpaceOnUse" x1={a.x} y1={a.y} x2={b.x} y2={b.y}><stop stopColor={colorText(a.color)}/><stop offset="1" stopColor={colorText(b.color)}/></linearGradient></defs>
          <path d={path} stroke={`url(#${id})`} strokeWidth={b.width} />
          <path d={path} stroke="white" strokeOpacity=".12" strokeWidth={b.width * .09} transform="translate(0 -12)"/>
          <path d={path} stroke="white" strokeOpacity=".07" strokeWidth="2" transform="translate(0 8)"/>
          <path d={path} stroke="#241526" strokeOpacity=".06" strokeWidth="2" transform="translate(0 15)"/>
        </g>;
      })}</g>)}
      </g>
    </svg>
    <button type="button" data-wipe-paint className={s.wipePaint} onClick={wipe}>Wipe paint</button>
  </div>;
}
