"use client";

/* The room's materials come from `@shift9/theme` like everything else.
   WebGL takes colours as JavaScript values, not CSS, so they are read off the
   document at mount rather than written twice. Change the token, the room
   changes — which is the whole point of the token.

   No fallback values on purpose. A hardcoded hex here would be exactly the
   thing the rule exists to stop, and it would go stale silently. If a token is
   missing the room does not render and the flat desktop takes over, which is
   the same path a machine without WebGL takes and is already proven. */

import type { RoomPalette } from "./scene";

const TOKENS = {
  yarn: "--s9-yarn-ochre",
  cuff: "--s9-yarn-cuff",
  key: "--s9-room-key",
  fill: "--s9-room-fill",
  screen: "--s9-room-screen",
  shell: "--s9-shell",
} as const;

export function readRoomPalette(): RoomPalette | null {
  if (typeof window === "undefined") return null;
  const computed = getComputedStyle(document.documentElement);
  const palette: Partial<RoomPalette> = {};
  for (const [name, token] of Object.entries(TOKENS) as [keyof RoomPalette, string][]) {
    const value = computed.getPropertyValue(token).trim();
    if (!value) return null;
    palette[name] = value;
  }
  return palette as RoomPalette;
}
