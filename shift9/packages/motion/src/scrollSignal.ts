"use client";

/**
 * scrollSignal — ONE shared scroll-velocity source for the whole system.
 *
 * Like the telemetry backbone, this owns a single passive `scroll` listener
 * and a single rAF, refcounted across every consumer (proximity type, the
 * Dither hero, the Work Wall). It writes into a stable module-level object and
 * fans out through `subscribeScroll`. Consumers read `getScroll()` straight off
 * the compositor's budget — zero React re-renders.
 *
 * The rAF runs ONLY while there is motion to settle: a scroll event kicks it,
 * and it stops itself once velocity has decayed to ~0. An idle page costs
 * nothing. The loop also parks while the tab is hidden.
 *
 * `velocity` is a normalized 0 (still) → 1 (hard flick) reading, EMA-smoothed
 * so it builds and releases instead of spiking per event. Velocity is the
 * input that lets type gain weight and the shader smear with momentum.
 */
export interface ScrollState {
  /** normalized, smoothed absolute scroll speed: 0 still → 1 hard flick */
  velocity: number;
  /** signed velocity, same scale (−1 fast up … +1 fast down) */
  signed: number;
  /** scroll direction: -1 up, 0 idle, +1 down */
  direction: -1 | 0 | 1;
  /** scroll depth, 0 → 1 */
  progress: number;
  /** raw scrollY in px */
  y: number;
}

const state: ScrollState = {
  velocity: 0,
  signed: 0,
  direction: 0,
  progress: 0,
  y: 0,
};

type Sub = (s: ScrollState) => void;
const subs = new Set<Sub>();

// px-per-frame that maps to velocity 1.0. ~52px/frame is a committed flick at
// 60fps; anything faster clamps to 1 so the response can't run away.
const MAX_SPEED = 52;
// How hard each frame eases toward the instantaneous speed. Lower = smoother
// build-up and a longer, more luxurious release.
const SMOOTH = 0.16;

let raf = 0;
let running = false;
let started = false;
let lastY = 0;
let smooth = 0; // smoothed px/frame magnitude
let idleFrames = 0;

function measure() {
  const y = window.scrollY || window.pageYOffset || 0;
  const dy = y - lastY;
  lastY = y;

  const inst = Math.abs(dy);
  smooth += (inst - smooth) * SMOOTH;
  state.velocity = Math.min(1, smooth / MAX_SPEED);
  state.signed = Math.max(-1, Math.min(1, (dy / MAX_SPEED) * 0.6 + state.signed * 0.4));
  state.direction = dy > 0.5 ? 1 : dy < -0.5 ? -1 : 0;

  const max =
    document.documentElement.scrollHeight - window.innerHeight;
  state.progress = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
  state.y = y;
}

function loop() {
  measure();
  for (const cb of subs) cb(state);

  // Keep ticking while there is anything left to settle; otherwise idle.
  if (state.velocity > 0.002 || Math.abs(state.signed) > 0.002) {
    idleFrames = 0;
    raf = requestAnimationFrame(loop);
  } else if (idleFrames < 4) {
    idleFrames += 1;
    raf = requestAnimationFrame(loop);
  } else {
    running = false;
    raf = 0;
    state.velocity = 0;
    state.signed = 0;
    state.direction = 0;
    for (const cb of subs) cb(state);
  }
}

function kick() {
  if (running || document.hidden) return;
  running = true;
  idleFrames = 0;
  raf = requestAnimationFrame(loop);
}

function onScroll() {
  kick();
}

function onVisibility() {
  if (document.hidden && raf) {
    cancelAnimationFrame(raf);
    raf = 0;
    running = false;
  }
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  lastY = window.scrollY || window.pageYOffset || 0;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  state.progress = max > 0 ? Math.min(1, Math.max(0, lastY / max)) : 0;
  state.y = lastY;
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
}

function stop() {
  if (!started) return;
  started = false;
  window.removeEventListener("scroll", onScroll);
  document.removeEventListener("visibilitychange", onVisibility);
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  running = false;
}

/**
 * Subscribe to scroll updates. Returns an unsubscribe that tears the shared
 * listeners down once the last consumer leaves. The callback is primed once
 * with the current state on subscribe.
 */
export function subscribeScroll(cb: Sub): () => void {
  start();
  subs.add(cb);
  cb(state);
  return () => {
    subs.delete(cb);
    if (subs.size === 0) stop();
  };
}

/** Read the live, shared scroll state synchronously (no re-render). */
export function getScroll(): Readonly<ScrollState> {
  return state;
}
