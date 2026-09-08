"use client";

import { createContext, Fragment, useContext, useEffect, useRef, useState, type ReactNode, type PointerEvent } from "react";
import s from "./soon.module.css";

type Point = [number, number];
const WipeContext = createContext<() => void>(() => {});
export function PaintResetProvider({ children }: { children: ReactNode }) {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (revision > 0) document.querySelector<HTMLButtonElement>("[data-wipe-paint]")?.focus({ preventScroll: true });
  }, [revision]);
  return <WipeContext.Provider value={() => setRevision(n => (n + 1) % 1000)}><Fragment key={revision}>{children}</Fragment></WipeContext.Provider>;
}
export default function PaintSurface({ children, className }: { children: ReactNode; className?: string }) {
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const wipe = useContext(WipeContext);
  const svg = useRef<SVGSVGElement>(null);
  const active = useRef<{ id: number; points: Point[] } | null>(null);
  const point = (e: PointerEvent<HTMLDivElement>): Point => {
    const matrix = svg.current?.getScreenCTM();
    const local = matrix ? new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse()) : new DOMPoint();
    return [Math.max(0, Math.min(1000, local.x)), Math.max(0, Math.min(700, local.y))];
  };
  return <div className={`${className ?? ""} ${s.paintSurface}`} data-smeared={strokes.length > 0 || undefined}
    onPointerDown={e => {
      if (e.button !== 0 || !(e.target instanceof Element) || !e.target.closest("button")?.querySelector("[data-flavor]")) return;
      active.current = { id: e.pointerId, points: [point(e)] };
    }}
    onPointerMove={e => {
      const drag = active.current;
      if (!drag || drag.id !== e.pointerId || !e.buttons) return;
      const next = point(e), last = drag.points[drag.points.length - 1];
      if (!last || Math.hypot(next[0] - last[0], next[1] - last[1]) < 8) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.points = [...drag.points.slice(-59), next];
      setStrokes(previous => drag.points.length === 2 ? [...previous.slice(-7), drag.points] : [...previous.slice(0, -1), drag.points]);
    }}
    onPointerUp={() => { active.current = null; }} onPointerCancel={() => { active.current = null; }}>
    {children}
    <svg ref={svg} className={s.rainbowGoop} viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="rainbow-goop" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ff248b"/><stop offset=".2" stopColor="#ff922b"/><stop offset=".4" stopColor="#ffe835"/><stop offset=".6" stopColor="#30e8a0"/><stop offset=".8" stopColor="#37b9ff"/><stop offset="1" stopColor="#c249ff"/></linearGradient></defs>
      {strokes.map((stroke, i) => <g key={i}><polyline points={stroke.map(p => p.join(",")).join(" ")} stroke="url(#rainbow-goop)" strokeWidth="90"/><polyline points={stroke.map(([x,y]) => `${x},${y-12}`).join(" ")} stroke="white" strokeOpacity=".22" strokeWidth="8"/></g>)}
    </svg>
    <button type="button" data-wipe-paint className={s.wipePaint} onClick={wipe}>Wipe paint</button>
  </div>;
}
