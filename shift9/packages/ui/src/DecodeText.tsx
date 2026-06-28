"use client";

import * as React from "react";
import { useReducedMotionSafe } from "@shift9/motion";

/* Monospace glyphs only, so the scramble never changes the text's width and
   the layout can't shift mid-decode. */
const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%/<>*+=";

/**
 * DecodeText — a terminal "decrypt" reveal. On first scroll into view each
 * character resolves left-to-right out of cycling glyphs, like the instrument
 * locking a readout. Pure cosmetic: the real string is the accessible name
 * (aria-label) and the animated node is aria-hidden, so screen readers never
 * see the scramble. Width is stable (monospace, same length, spaces kept).
 *
 * SSR renders the final text, so there is no hydration mismatch and no layout
 * shift. Under reduced motion it simply renders the text and never animates.
 */
export function DecodeText({
  text,
  className,
  duration = 620,
}: {
  text: string;
  className?: string;
  duration?: number;
}) {
  const reduced = useReducedMotionSafe();
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    const chars = Array.from(text);
    const n = Math.max(1, chars.length);
    let raf = 0;
    let start = 0;
    let running = false;

    const frame = (now: number) => {
      if (!start) start = now;
      const t = now - start;
      const cycle = Math.floor(now / 40);
      let out = "";
      let done = true;
      for (let i = 0; i < chars.length; i++) {
        const c = chars[i]!;
        if (c === " ") {
          out += " ";
          continue;
        }
        const resolveAt = (i / n) * duration * 0.65;
        if (t >= resolveAt + duration * 0.35) {
          out += c;
        } else {
          out += GLYPHS[(cycle + i * 3) % GLYPHS.length];
          done = false;
        }
      }
      el.textContent = out;
      if (done) {
        el.textContent = text;
        running = false;
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !running) {
          running = true;
          start = 0;
          raf = requestAnimationFrame(frame);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced, text, duration]);

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden ref={ref}>
        {text}
      </span>
    </span>
  );
}
