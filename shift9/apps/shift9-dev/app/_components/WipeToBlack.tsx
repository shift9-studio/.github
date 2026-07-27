"use client";

/* ────────────────────────────────────────────────────────────────────────
   WIPE TO BLACK — the desktop hands over to the studio.

   Replaces the sinkhole, which replaced a corridor. Both of those tried to
   make the transition itself the event. It is not: the studio is the event,
   and the job of what comes between is to get out of the way with some grace.
   A wipe is what a cutting room uses for exactly this, and it has lasted
   because it does one legible thing and then stops.

   ── The shape of it ──────────────────────────────────────────────────────
   One panel, wider than the viewport, travelling across it on a slight rake.
   Its leading edge is feathered rather than hard: a hard line reads as a
   sheet of card being slid over the screen, and the feather is the whole
   difference between a wipe that looks designed and one that looks like a
   div. Behind the feather it is solid black, and the panel is wider than the
   frame so that by the time the travel ends the solid part covers it with
   room to spare — a wipe that arrives one pixel short is a flash of desktop
   at the exact moment the visitor is meant to be somewhere else. The exact
   numbers, and the version that got them wrong, are on the panel below.

   Black, not a colour, because the studio's own ground is black. The last
   frame of this and the first frame of the next page are the same value, so
   there is no cut to see and nothing to reconcile.

   ── Cost ─────────────────────────────────────────────────────────────────
   A transform on one element. No canvas, no rAF, no per-frame work of any
   kind — the compositor runs it on its own thread and the main thread is
   left free for the thing that actually matters here, which is the next
   route mounting underneath.

   ── Contract ─────────────────────────────────────────────────────────────
   - Decorative. aria-hidden, pointer-events: none.
   - prefers-reduced-motion never mounts this; the caller navigates straight
     through, which is a clean cut rather than a paused half-state.
   - Duration comes from --s9-dur-tunnel, so the pace stays a token.
   - onDone fires on transitionend, with a timer as the backstop: rAF and
     transitions both stall in a backgrounded tab, and a visitor who switches
     away mid-wipe must not come back to a dead screen.
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

export function WipeToBlack({ onDone }: { onDone: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  /* Held in a ref so a re-render can never fire the navigation twice. */
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const panel = panelRef.current;
    /* The click that opened this has already been cancelled, so every exit
       from here must still hand navigation on. Bailing silently would strand
       the visitor on the desktop with a dead icon. */
    if (!panel) {
      doneRef.current();
      return;
    }

    const duration = cssMs("--s9-dur-tunnel", 560);
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      doneRef.current();
    };

    /* Two frames before releasing the transform: one for the element to be in
       the document with its starting transform committed, one for the style
       change to be seen as a change rather than as the initial value. A
       single rAF here is the classic off-by-one that makes a transition
       silently not run. */
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        panel.style.transition = `transform ${duration}ms var(--s9-ease-inout, cubic-bezier(0.65, 0, 0.35, 1))`;
        panel.style.transform = "translate3d(0, 0, 0)";
      });
    });

    panel.addEventListener("transitionend", finish, { once: true });
    /* Transitions do not run in a backgrounded tab, so transitionend may never
       arrive. The timer does. */
    const watchdog = window.setTimeout(finish, duration + 260);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(watchdog);
      panel.removeEventListener("transitionend", finish);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <div
        ref={panelRef}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          /* The geometry has to be checked, not eyeballed, because getting it
             wrong fails in the one frame nobody screenshots. The panel is 170%
             of the frame and the fill is solid for its first 76%, so at rest
             the solid region is 1.70 x 0.76 = 1.29 viewports — it covers with
             29% to spare.

             The first attempt was 130% wide and solid to 74%: 0.96 viewports.
             Measured, it peaked at 92.6% coverage, which means a strip of live
             desktop was still on screen at the instant the route changed. That
             is exactly the flash this component exists to prevent, and it was
             invisible in every screenshot — it only surfaced by sampling the
             covered fraction every frame. */
          width: "170%",
          transform: "translate3d(-100%, 0, 0)",
          /* Solid, then a feathered leading edge on a slight rake. The angle
             is what stops it reading as a horizontal blind. */
          background:
            "linear-gradient(100deg, #000 0%, #000 76%, rgba(0, 0, 0, 0.55) 90%, rgba(0, 0, 0, 0) 100%)",
          willChange: "transform",
        }}
      />
    </div>
  );
}
