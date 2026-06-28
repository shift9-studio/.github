"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useReducedMotionSafe } from "@shift9/motion";

/* What the reticle can lock onto. Opt OUT of any node with data-reticle-off. */
const SELECTOR =
  'a[href], button:not([disabled]), [role="button"], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"]), [data-reticle]';

/* px the brackets sit OUTSIDE the target box — clears the focus ring so the
   reticle frames it rather than colliding with it. */
const PAD = 6;
const RETICLE_SPRING = { stiffness: 420, damping: 34, mass: 0.8 };

function interactiveAncestor(t: EventTarget | null): Element | null {
  if (!(t instanceof Element)) return null;
  const el = t.closest(SELECTOR);
  return el && !el.hasAttribute("data-reticle-off") ? el : null;
}

/**
 * EdgeReticle — a single camera-style viewfinder. Four corner brackets (the
 * same registration-tick language as GridFrame) spring to frame whatever
 * interactive control you focus with the keyboard, or hover on a fine pointer.
 * One overlay FLIP-animates between targets, so the reticle *flies* from
 * control to control.
 *
 * It AUGMENTS, never replaces, the mandatory :focus-visible ring — so keyboard
 * users keep their guaranteed high-contrast outline and gain a locking
 * viewfinder on top. aria-hidden, pointer-events-none, never focusable; it
 * only observes. Under reduced motion the brackets jump instantly (no fly).
 */
export function EdgeReticle() {
  const reduced = useReducedMotionSafe();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const w = useMotionValue(0);
  const h = useMotionValue(0);
  const o = useMotionValue(0);

  const sx = useSpring(x, RETICLE_SPRING);
  const sy = useSpring(y, RETICLE_SPRING);
  const sw = useSpring(w, RETICLE_SPRING);
  const sh = useSpring(h, RETICLE_SPRING);
  const so = useSpring(o, { stiffness: 300, damping: 30 });

  const activeRef = React.useRef<Element | null>(null);

  React.useEffect(() => {
    const fine = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;

    const place = (el: Element) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      x.set(r.left - PAD);
      y.set(r.top - PAD);
      w.set(r.width + PAD * 2);
      h.set(r.height + PAD * 2);
      o.set(1);
      activeRef.current = el;
    };
    const hide = () => {
      o.set(0);
      activeRef.current = null;
    };

    const isKeyboardFocused = () => {
      const el = document.activeElement;
      if (!el || el === document.body) return false;
      try {
        return el.matches(SELECTOR) && el.matches(":focus-visible");
      } catch {
        return false;
      }
    };

    const onFocusIn = (e: FocusEvent) => {
      const el = interactiveAncestor(e.target);
      if (!el) return;
      let kbd = true;
      try {
        kbd = el.matches(":focus-visible");
      } catch {
        /* :focus-visible unsupported → treat focus as keyboard */
      }
      if (kbd) place(el);
    };
    const onFocusOut = () => {
      // If a pointer is still hovering a target, onOver will re-show it.
      if (!activeRef.current || activeRef.current === document.activeElement)
        hide();
    };
    const onOver = (e: Event) => {
      if (!fine) return;
      const el = interactiveAncestor(e.target);
      if (el) {
        if (el !== activeRef.current) place(el);
      } else if (!isKeyboardFocused()) {
        hide();
      }
    };
    const onReposition = () => {
      if (activeRef.current) place(activeRef.current);
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("scroll", onReposition, { passive: true });
    window.addEventListener("resize", onReposition, { passive: true });

    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("scroll", onReposition);
      window.removeEventListener("resize", onReposition);
    };
  }, [x, y, w, h, o]);

  // Reduced motion → bind raw values so the reticle jumps without a spring.
  const bx = reduced ? x : sx;
  const by = reduced ? y : sy;
  const bw = reduced ? w : sw;
  const bh = reduced ? h : sh;
  const bo = reduced ? o : so;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[45]"
      style={{ x: bx, y: by, width: bw, height: bh, opacity: bo }}
    >
      <span className="absolute left-0 top-0 h-2 w-2 border-l border-t border-signal" />
      <span className="absolute right-0 top-0 h-2 w-2 border-r border-t border-signal" />
      <span className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-signal" />
      <span className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-signal" />
    </motion.div>
  );
}
