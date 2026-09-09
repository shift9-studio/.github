"use client";

import { useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { PaintReplyLayer } from "./PaintSurface";
import s from "./soon.module.css";

export default function TouchPaint({ children, className, style, reply, label, trick = "splat" }: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  reply: string;
  label: string;
  trick?: "splat" | "rocket" | "rewind" | "jelly" | "twist" | "hop" | "stretch";
}) {
  const [touches, setTouches] = useState(0);
  const layer = useContext(PaintReplyLayer);
  const button = useRef<HTMLButtonElement>(null);
  const [replyPosition, setReplyPosition] = useState<CSSProperties>();
  useLayoutEffect(() => {
    const node = button.current;
    if (!node || !layer || !touches || trick === "jelly") return;
    const position = () => setReplyPosition({
      left: node.offsetLeft + node.offsetWidth / 2,
      top: node.offsetTop + node.offsetHeight / 2,
      transform: `translate(-50%, -50%) rotate(${getComputedStyle(node).getPropertyValue("--r") || "0deg"}) skewX(-4deg)`,
      display: node.offsetWidth ? undefined : "none",
    });
    position();
    const observer = new ResizeObserver(position);
    observer.observe(node);
    if (node.offsetParent) observer.observe(node.offsetParent);
    return () => observer.disconnect();
  }, [layer, touches, trick]);
  const [phase, setPhase] = useState(0);
  const [launching, setLaunching] = useState(false);
  useEffect(() => {
    if (!launching) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => setLaunching(false);
    motion.addEventListener("change", stop);
    const timeout = setTimeout(stop, 1800);
    return () => { motion.removeEventListener("change", stop); clearTimeout(timeout); };
  }, [launching, touches]);
  useEffect(() => {
    if (trick !== "jelly") return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setInterval> | undefined;
    const sync = () => {
      clearInterval(timer);
      if (!motion.matches && !document.hidden) timer = setInterval(() => setPhase(n => (n + 1) % 6), 3800);
    };
    sync();
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => { clearInterval(timer); motion.removeEventListener("change", sync); document.removeEventListener("visibilitychange", sync); };
  }, [trick]);
  const seed = Array.from(label).reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const nineStyle = trick === "jelly" ? {
    "--nine-hue": `${(touches * 137 + 45) % 360}deg`,
    "--nine-skew": `${(touches * 7) % 25 - 12}deg`,
    "--nine-wide": 0.9 + ((touches * 3) % 5) * 0.065,
  } as CSSProperties : undefined;
  return (
    <button ref={button} type="button" className={`${className ?? ""} ${s.touchPaint}`}
      data-nine-look={trick === "jelly" ? phase : undefined}
      data-launching={launching || undefined}
      style={{ ...style, ...nineStyle }} aria-label={label} onClick={() => {
        setTouches(n => n % 999 + 1);
        setLaunching(trick === "rocket" && !matchMedia("(prefers-reduced-motion: reduce)").matches);
      }}>
      <span key={`art-${touches}-${phase}`} className={trick === "jelly" ? s.nineActor : undefined}>{children}</span>
      {touches > 0 && trick !== "jelly" && <span key={touches} className={s.paintShow} data-trick={trick} data-flavor={(touches + seed) % 3}>
        <span className={s.paintReply} role="status" style={layer ? { visibility: "hidden" } : undefined}>{reply}</span>
        {layer && replyPosition && createPortal(<span key={touches} className={`${s.paintReply} ${s.floatingReply}`} data-trick={trick} style={replyPosition} role="status">{reply}</span>, layer)}
        <span className={s.wetDrips} aria-hidden="true"><i /><i /></span>
        {Array.from({ length: 6 }, (_, i) => <i key={i} className={s.droplet} aria-hidden="true" style={{ "--i": i } as CSSProperties} />)}
        {trick === "rocket" && <svg onAnimationEnd={() => setLaunching(false)} className={s.paperRocket} viewBox="0 0 64 64" aria-hidden="true"><path d="M4 28 60 4 39 59 27 37Z" fill="white" stroke="currentColor" strokeWidth="3"/><path d="m27 37 33-33-23 37" fill="none" stroke="currentColor" strokeWidth="3"/></svg>}
      </span>}
    </button>
  );
}
