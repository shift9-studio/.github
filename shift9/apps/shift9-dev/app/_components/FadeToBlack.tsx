"use client";

/* ────────────────────────────────────────────────────────────────────────
   FADE TO BLACK — the desktop hands over to the studio.

   The fourth version of this, and the shortest. It was a corridor of flying
   planes, then a sinkhole, then a wipe. Every one of them was an *effect*,
   and an effect between two rooms is a thing the visitor has to watch before
   they are allowed to arrive. The studio is what they came for.

   So: the lights go down. That is all. It is the oldest transition there is
   because it is the one that draws no attention to itself — and it is the
   only one here that cannot look cheap, because there is nothing to execute
   badly. No geometry to get wrong, no edge to feather, no coverage to check.
   The screen darkens, and on the other side the studio comes up out of the
   same black (see StudioDolly's own fade-in). Two halves of one dissolve.

   Cost: opacity on one element, on the compositor's own thread. Nothing per
   frame, nothing on the main thread, which is left free for the route
   mounting underneath.

   ── Contract ─────────────────────────────────────────────────────────────
   - Decorative. aria-hidden, pointer-events: none.
   - prefers-reduced-motion never mounts this; the caller navigates straight
     through — a clean cut, not a paused half-state.
   - Duration comes from --s9-dur-tunnel, so the pace stays a token and the
     two halves of the dissolve can be tuned together.
   - onDone fires on transitionend, with a timer as the backstop: transitions
     stall in a backgrounded tab, and a visitor who switches away mid-fade
     must not come back to a dead screen.
   ──────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";

function cssMs(name: string, fallback: number) {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  if (!raw) return fallback;
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return fallback;
  return raw.endsWith("ms") ? n : n * 1000;
}

export function FadeToBlack({ onDone }: { onDone: () => void }) {
  const veilRef = useRef<HTMLDivElement>(null);
  /* Held in a ref so a re-render can never fire the navigation twice. */
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const veil = veilRef.current;
    /* The click that opened this has already been cancelled, so every exit
       from here must still hand navigation on. Bailing silently would strand
       the visitor on the desktop with a dead icon. */
    if (!veil) {
      doneRef.current();
      return;
    }

    const duration = cssMs("--s9-dur-tunnel", 420);
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      doneRef.current();
    };

    /* Two frames before releasing the opacity: one for the element to be in
       the document with its starting value committed, one for the change to
       be seen as a change rather than as the initial value. A single rAF here
       is the classic off-by-one that makes a transition silently not run. */
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        veil.style.transition = `opacity ${duration}ms var(--s9-ease-inout, cubic-bezier(0.65, 0, 0.35, 1))`;
        veil.style.opacity = "1";
      });
    });

    veil.addEventListener("transitionend", finish, { once: true });
    const watchdog = window.setTimeout(finish, duration + 240);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(watchdog);
      veil.removeEventListener("transitionend", finish);
    };
  }, []);

  return (
    <div
      ref={veilRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
        background: "#000",
        opacity: 0,
      }}
    />
  );
}
