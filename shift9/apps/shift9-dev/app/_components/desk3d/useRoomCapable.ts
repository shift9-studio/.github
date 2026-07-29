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
   flat layout. */
const ROOM_QUERY = "(pointer: fine) and (min-width: 64rem) and (min-height: 34rem)";

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
