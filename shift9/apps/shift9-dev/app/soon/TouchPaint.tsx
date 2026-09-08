"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import s from "./soon.module.css";

export default function TouchPaint({ children, className, style, reply, label }: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  reply: string;
  label: string;
}) {
  const [touches, setTouches] = useState(0);
  return (
    <button type="button" className={`${className ?? ""} ${s.touchPaint}`}
      style={style} aria-label={label} onClick={() => setTouches(n => (n + 1) % 1000)}>
      {children}
      {touches > 0 && <span key={touches} className={s.paintReply} role="status">{reply}</span>}
    </button>
  );
}
