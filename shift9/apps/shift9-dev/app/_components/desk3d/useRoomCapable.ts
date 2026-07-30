"use client";

/* Can this machine, and this window, be given the room at all?
 *
 * Deliberately in its own file with no 3D imports anywhere in its graph. The
 * entrance has to ask this question on every visit, including the visits that
 * will never get a room — a phone, a machine without WebGL — and if asking it
 * pulled in the renderer then those visitors would download three.js in order
 * to be told they are not getting it. `DeskRoom` is loaded on demand, after
 * this returns true; this file is what makes that possible.
 */

import { useEffect, useState } from "react";
import { readRoomPalette } from "./palette";

/* Under this, the desktop inside the monitor is too small to use at any
   framing, so the room is not offered and the flat desktop is the site. Matches
   the repo's standing rule that 3D is a desktop affordance and phones get the
   flat layout.
 *
 * The two aspect bounds are the plate's, not a preference — and both were
 * measured by flooding the monitor's glass and reading its bounding box against
 * the viewport at nine sizes (`scratchpad/sweep.mjs`, reproduced in the PR):
 *
 *   below 8/5   The backdrop covers the viewport, so a window narrower than the
 *               film crops the film's sides. Past 8/5 the crop reaches the
 *               monitor and takes the glass's left edge off frame. A 4:3 window
 *               loses both sides of it.
 *   above 2/1   The same crop, vertically: above ~2.05:1 the film's own monitor
 *               has its top edge outside the frame — at ANY monitor size, the
 *               34" one included, because the plate only has 70px of wall above
 *               it. This is not something the room introduced and not something
 *               it can fix; the frame does not contain the pixels.
 *
 * Outside those bounds the flat desktop is the site — the same fallback a
 * machine without WebGL gets, which is already the proven path. That is a real
 * trade and worth naming: an ultrawide window gets no room. Letterboxing the
 * plate would keep it, but the film's own beat is `object-fit: cover`, and
 * black bars appearing on the handover frame would make the locked cut from
 * film to room visible. Not worth it. */
const ROOM_QUERY =
  "(pointer: fine) and (min-width: 64rem) and (min-height: 34rem)" +
  " and (min-aspect-ratio: 8/5) and (max-aspect-ratio: 2/1)";

/**
 * `null` until measured, so the server (which always renders the flat
 * desktop) and the first client render agree and nothing flashes.
 */
export function useRoomCapable(): boolean | null {
  const [capable, setCapable] = useState<boolean | null>(null);

  useEffect(() => {
    let webgl = false;
    try {
      const probe = document.createElement("canvas");
      webgl = Boolean(probe.getContext("webgl2") ?? probe.getContext("webgl"));
    } catch {
      /* Some hardened browsers throw rather than return null. Same answer. */
      webgl = false;
    }

    /* No palette means `@shift9/theme` did not load the room's tokens, and the
       scene has no colours it is allowed to use. Same exit as no WebGL. */
    if (!webgl || !readRoomPalette()) {
      setCapable(false);
      return;
    }

    const query = window.matchMedia(ROOM_QUERY);
    const read = () => setCapable(query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  return capable;
}
