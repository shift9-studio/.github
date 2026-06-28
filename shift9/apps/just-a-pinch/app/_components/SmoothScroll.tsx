"use client";

import * as React from "react";
import Lenis from "lenis";
import { useReducedMotionSafe } from "@shift9/motion";

/**
 * Physics-based smooth scroll for Just a Pinch. Same inertial wheel glide and
 * smoothed anchor navigation as the studio site, and the same source of the
 * scroll-velocity signal the kinetic headlines read. Fully gated by reduced
 * motion (native scroll when the user asks for less). Touch stays native.
 */
export function SmoothScroll() {
  const reduced = useReducedMotionSafe();

  React.useEffect(() => {
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

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
