"use client";

import { useReducedMotion } from "framer-motion";

/**
 * The single accessibility gate. framer-motion returns `boolean | null`
 * (null until measured) — we collapse that to a stable boolean so every
 * consumer can branch on one switch.
 */
export function useReducedMotionSafe(): boolean {
  return useReducedMotion() ?? false;
}
