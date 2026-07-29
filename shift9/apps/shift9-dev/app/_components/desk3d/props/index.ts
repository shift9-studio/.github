/* Everything standing in the room, in draw order.
 *
 * ADDING A PROP — the whole procedure:
 *   1. a file beside this one that default-exports a `SceneProp`
 *      (`hand.tsx` is the worked example),
 *   2. a `transform` on it, measured off the plate against the debug
 *      wireframe (`?wire` on the page turns it on),
 *   3. a `hotspot` if it should be reachable and operable without a mouse —
 *      `DeskRoom` renders those as real focusable buttons and hands the
 *      `signal` back; `SCREEN.hotspot` in `scene.ts` is the worked example.
 *   4. add it to the array below.
 *
 * No registration anywhere else. `DeskScene` maps this list and knows nothing
 * about what is in it.
 *
 * Depth caveat that decides where a prop MAY go: the composited desktop is
 * browser-composited above the WebGL layer, so nothing here can be drawn in
 * front of the monitor's glass. Props belong on the desk or further into the
 * room, not between the camera and the screen. `ScreenSurface.tsx` explains
 * why, and what to do if one ever has to.
 */

import type { SceneProp } from "../scene";
import hand from "./hand";

export const SET_PIECES: SceneProp[] = [hand];
