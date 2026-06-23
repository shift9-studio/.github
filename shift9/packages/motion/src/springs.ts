import type { Transition } from "framer-motion";

/**
 * The house spring physics. Every interaction in the system pulls from
 * here — never an ad-hoc duration. Tuned for a premium, slightly
 * under-damped settle.
 */
export const springs = {
  premium: { type: "spring", stiffness: 420, damping: 32, mass: 0.9 },
  magnetic: { type: "spring", stiffness: 260, damping: 18, mass: 0.6 },
  soft: { type: "spring", stiffness: 140, damping: 22, mass: 1.0 },
} as const satisfies Record<string, Transition>;

export type SpringName = keyof typeof springs;
