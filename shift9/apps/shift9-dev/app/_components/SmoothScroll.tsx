"use client";

import * as React from "react";
import Lenis from "lenis";
import { useReducedMotionSafe } from "@shift9/motion";

/**
 * Physics-based smooth scroll. Replaces the browser's stepped wheel scroll
 * with an inertial glide on the house decelerate curve, and routes in-page
 * anchor clicks (`#work`, `#contact`) through the same easing instead of a
 * hard jump. This is also what gives the scroll-velocity signal something
 * smooth to read, so kinetic type and the Dither hero respond to momentum.
 *
 * Fully gated by reduced motion: when the user asks for less motion we never
 * construct Lenis, so native (instant) scrolling and anchor jumps are used.
 * Touch scrolling stays native — only the wheel is smoothed.
 */
export function SmoothScroll() {
  const reduced = useReducedMotionSafe();

  React.useEffect(() => {
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.05,
      // cubic-out — the same deceleration shape as --s9-ease-out
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Smooth in-page anchor navigation through Lenis.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey)
        return;
      const link = (e.target as Element | null)?.closest<HTMLAnchorElement>(
        'a[href^="#"]',
      );
      const hash = link?.getAttribute("href");
      if (!link || !hash || hash === "#") return;
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -24 });
      history.pushState(null, "", hash);
    };
    document.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
      lenis.destroy();
    };
  }, [reduced]);

  return null;
}
