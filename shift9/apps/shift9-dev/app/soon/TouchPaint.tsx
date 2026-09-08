"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import s from "./soon.module.css";

export default function TouchPaint({ children, className, style, reply, label, trick = "splat" }: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  reply: string;
  label: string;
  trick?: "splat" | "rocket" | "rewind" | "jelly";
}) {
  const [touches, setTouches] = useState(0);
  const seed = Array.from(label).reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return (
    <button type="button" className={`${className ?? ""} ${s.touchPaint}`}
      style={style} aria-label={label} onClick={() => setTouches(n => n % 999 + 1)}>
      <span key={`art-${touches}`} className={touches && trick === "jelly" ? s.jelly : undefined}>{children}</span>
      {touches > 0 && <span key={touches} className={s.paintShow} data-trick={trick} data-flavor={(touches + seed) % 3}>
        <span className={s.paintReply} role="status">{reply}</span>
        <span className={s.wetDrips} aria-hidden="true"><i /><i /></span>
        {Array.from({ length: 6 }, (_, i) => <i key={i} className={s.droplet} aria-hidden="true" style={{ "--i": i } as CSSProperties} />)}
        {trick === "rocket" && <svg className={s.paperRocket} viewBox="0 0 64 64" aria-hidden="true"><path d="M4 28 60 4 39 59 27 37Z" fill="white" stroke="currentColor" strokeWidth="3"/><path d="m27 37 33-33-23 37" fill="none" stroke="currentColor" strokeWidth="3"/></svg>}
      </span>}
    </button>
  );
}
