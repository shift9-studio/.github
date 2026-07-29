/* ────────────────────────────────────────────────────────────────────────
   THE ROOM — every measurement the 3D desk scene is built from.

   No React in this file. It is the single place the scene's geometry is
   decided, so a later prop is a file, a transform from here, and (if it should
   be reachable) a hotspot. Nothing else in the scene hardcodes a position.

   ── How the numbers were arrived at ────────────────────────────────────────
   The backdrop is one frame of the opening film — the last frame before the
   crocheted hand enters. Everything else in the room is solved FROM that
   frame, not eyeballed against it: the monitor is where the film's monitor is,
   at the depth its real-world size puts it, seen through the lens the frame
   implies. That is the whole trick. If the numbers below are right the
   composite lines up on the first render; if they are wrong no amount of
   nudging saves it.

   The screen's four corners were read off the plate at 5x zoom against a
   10px grid (`scripts/build-handoff-plate.py` cuts the plate; the grid was a
   throwaway). They are the only measured inputs. One physical constant is
   assumed — the panel is a 34" ultrawide, so its glass is 0.80m across — and
   that single number sets the scale of the entire room.

   Two sanity checks came out right, which is the reason to trust the rest:
     · corner aspect 2.290 vs a 34" 21:9 panel's 2.389 — the ~4% is the
       curve, which a flat quad cannot have.
     · the crocheted hand at 9.35s measures 9.1cm across the knuckles on the
       desk plane derived below. A hand is 9-10cm. Nothing was fitted to make
       that true.
   ──────────────────────────────────────────────────────────────────────── */

import type { ComponentType } from "react";

/** The room's materials, read from `@shift9/theme` at runtime — see
 *  `palette.ts`. Passed to every prop so no prop ever writes a colour. */
export type RoomPalette = {
  yarn: string;
  cuff: string;
  key: string;
  fill: string;
};

/* The plate. Cut by `scripts/build-handoff-plate.py` from the film's second
   beat; that script owns the file and the timestamp. Do not hand-replace it. */
export const PLATE_SRC = "/experience/opening/04-desk-handoff-plate.jpg";
export const PLATE_W = 1928;
export const PLATE_H = 1076;
export const PLATE_ASPECT = PLATE_W / PLATE_H;

/* Where the film stops and the room takes over, in seconds.

   8.5s is the frame the hand enters on. 8.4s is the last frame without it —
   the plate. Stopping at 8.45 lands on the frame between the two, which
   differs from the plate by a mean of 1.4/255 per channel (JPEG noise; 102
   pixels of a two-megapixel frame move at all). So the cut has nothing to
   show. Measured, not assumed — and the same measurement is written up in
   `scripts/build-handoff-plate.py`, which cuts the plate this hands over to.

   The mp4 is untouched. This is a playback stop, not an edit. */
export const HANDOFF_AT_S = 8.45;

/** The plate's own timestamp — see `scripts/build-handoff-plate.py`.
 *
 *  Playback is rewound to exactly here once it stops. Stopping a video at a
 *  chosen moment is never frame-exact: the callback fires after a frame is
 *  already on screen, so `currentTime` at the stop drifts with the machine's
 *  load. Two runs of the same test on this box stopped at 8.460 and 8.498 —
 *  both still inside the frame that runs 8.458→8.500, but the second one is
 *  2ms from the frame the hand walks into.
 *
 *  Rewinding removes the question. Whatever moment playback actually stops at,
 *  the frame left on screen is the one the room's backdrop was cut from — so
 *  the film can never hand over on a frame with a hand in it, however badly
 *  the machine is struggling. */
export const PLATE_AT_S = 8.4;

/* ── The measured input ──────────────────────────────────────────────────
   The four corners of the monitor's glass, in plate pixels, clockwise from
   top-left. The bottom edge is 27px narrower than the top: the panel leans
   its top toward the camera, and that lean is solved for below rather than
   ignored. 27px against a ~3px reading error is signal, not noise. */
const SCREEN_CORNERS = {
  tl: [405, 72],
  tr: [1450, 70],
  br: [1440, 522],
  bl: [422, 521],
} as const;

/* The one physical constant. A 34" 21:9 panel is 0.7998m of glass across.
   Every other dimension in the room is in metres because of this line. */
const SCREEN_WIDTH_M = 0.7998;

/* The lens. The plate is a generated frame, so its true focal length is not
   recorded anywhere — but the choice is not free-floating: it sets the camera
   distance, and the camera distance has to put a person at a desk. 35°
   vertical puts the eye 1.32m from the screen, which is a person sitting at
   a desk. 20° would put them across the room; 60° would put their nose on
   the glass.

   Changing this rescales the whole room together — the composite still lines
   up, because a fov change is a scale about the frame's centre and the
   backdrop scales with it. It only changes how much the room parallaxes once
   anything in here starts moving. */
const DESIGN_FOV_DEG = 35;

/* How much of the frame the room fills. 1 is the film's own framing, to the
   pixel — the monitor is 55% of the width, exactly where the film left it,
   and the desk and the wall and the plants are all still there around it.

   Above 1 pushes in: the desktop gets bigger and easier to read, the room
   gets tighter, and the plate — 1928px, and un-reshootable, because the film
   is locked — gets softer in proportion.

   ⚠ THE CEILING IS 1.14, and it is geometry, not taste. The zoom is a fov
   change about the CENTRE OF FRAME, and the monitor does not sit at the
   centre of frame; its glass runs from y=70 to y=522 of a 1076px plate, well
   above the middle. So pushing in eats the top of the monitor before it eats
   anything else. The glass's top edge leaves frame at z = 540/470 = 1.149.
   Rendered at 1.5 to check: the top third of the screen is gone and the
   desktop is cropped. Do not go past 1.14 expecting more room to appear.

   Zooming about the SCREEN instead of the frame would lift that ceiling, and
   was tried: it needs `camera.setViewOffset`, which shifts the projection's
   principal point — and three's CSS3DRenderer assumes a centred projection,
   so the composited desktop slides off the glass it is meant to be welded to.
   The composite is the point of this milestone, so the ceiling stays.

   Getting properly closer needs a re-shot beat, which is locked. Left at 1 =
   faithful to the approved join. */
export const FRAMING_ZOOM = 1;

/* ── Everything below is derived. Do not hand-edit; change an input above. ── */

const DESIGN_FOV = (DESIGN_FOV_DEG * Math.PI) / 180;

/* Focal length expressed in plate pixels — the bridge between "a pixel on the
   plate" and "a metre in the room". A point at depth z sits at
   (px - centre) * z / FOCAL_PX metres off the axis. */
const FOCAL_PX = PLATE_H / 2 / Math.tan(DESIGN_FOV / 2);

const cx = PLATE_W / 2;
const cy = PLATE_H / 2;

/* Solve the panel's pose from the corners — exactly, one edge at a time.

   The trick is to stop thinking about the panel's centre. Perspective is not
   linear, so the centre of the projected quad is NOT the projection of the
   panel's centre, and treating it as one leaves a systematic error: the first
   version of this file did exactly that and put the top edge ~0.7% low, which
   is a 9px black slit above the desktop on a 2560 display. Measured, then
   fixed, rather than nudged.

   Each edge, though, is solvable on its own with no approximation at all. An
   edge of known real width covering a known number of pixels is at a known
   depth — that is just similar triangles — and once its depth is known its
   height above the axis follows from where it sits in frame. Do that for the
   top edge and the bottom edge and the panel is fully determined: two points
   in space, and everything else is the line between them. */
const topWidthPx = SCREEN_CORNERS.tr[0] - SCREEN_CORNERS.tl[0];
const bottomWidthPx = SCREEN_CORNERS.br[0] - SCREEN_CORNERS.bl[0];

/* Depth of each edge. The top edge covers more pixels than the bottom for the
   same 0.80m of glass, so the top is nearer — the panel leans its top toward
   the camera. 27px on 1045 is a 2.6% difference against a reading error of
   about 3px, so it is the panel, not the measurement. */
const topDepth = (FOCAL_PX * SCREEN_WIDTH_M) / topWidthPx;
const bottomDepth = (FOCAL_PX * SCREEN_WIDTH_M) / bottomWidthPx;

const edge = (
  ax: number,
  ay: number,
  bx: number,
  by: number,
  depth: number,
): { x: number; y: number; z: number } => ({
  x: (((ax + bx) / 2 - cx) * depth) / FOCAL_PX,
  y: (-((ay + by) / 2 - cy) * depth) / FOCAL_PX,
  z: -depth,
});

const topEdge = edge(
  SCREEN_CORNERS.tl[0],
  SCREEN_CORNERS.tl[1],
  SCREEN_CORNERS.tr[0],
  SCREEN_CORNERS.tr[1],
  topDepth,
);
const bottomEdge = edge(
  SCREEN_CORNERS.bl[0],
  SCREEN_CORNERS.bl[1],
  SCREEN_CORNERS.br[0],
  SCREEN_CORNERS.br[1],
  bottomDepth,
);

/* Two points, so: the height is the distance between them, the lean is the
   angle of the line joining them, and the centre is halfway. */
const screenHeightM = Math.hypot(
  topEdge.y - bottomEdge.y,
  topEdge.z - bottomEdge.z,
);
/* Positive: a +X rotation in three.js swings the plane's top edge toward a
   camera on +Z, which is the direction the widths say the panel leans. Getting
   this backwards is invisible in a bounding box — both signs give the same
   outer rectangle, one just has the wide edge at the wrong end — so it has to
   be checked against the top and bottom edge widths separately, and is. */
const screenTilt = Math.atan2(topEdge.z - bottomEdge.z, topEdge.y - bottomEdge.y);
const screenCentre = {
  x: (topEdge.x + bottomEdge.x) / 2,
  y: (topEdge.y + bottomEdge.y) / 2,
  z: (topEdge.z + bottomEdge.z) / 2,
};

/* The monitor. Position is the glass's centre; rotation.x is negative because
   the top leans toward the camera, and in three.js a positive X rotation
   pushes the +Y edge away from a camera sitting on +Z. */
export const SCREEN = {
  width: SCREEN_WIDTH_M,
  height: screenHeightM,
  aspect: SCREEN_WIDTH_M / screenHeightM,
  position: [screenCentre.x, screenCentre.y, screenCentre.z] as [number, number, number],
  rotation: [screenTilt, 0, 0] as [number, number, number],
  /* The way back to a full-size desktop.

     Compositing the desktop into the monitor shrinks it — at the film's own
     framing the screen is 54% of the viewport width, so the whole interface
     renders at roughly 54% linear scale and 13px type lands near 7px. That is
     not a legibility bar anything clears, and it is not something the room can
     solve: the room is the reason it happens.

     So the full-size desktop stays one keypress away, and this is where that
     control lives. Placed on the bezel below the glass's right corner rather
     than over the screen, so it never sits on top of the thing it is offering
     to enlarge. */
  hotspot: {
    signal: "full-size",
    label: "View the desktop full size",
    /* Bezel, lower right — in the monitor's own space, so it travels with the
       panel if the panel ever moves. Y is just past the bottom edge. */
    at: [0.34, -0.5 * screenHeightM - 0.028, 0.004] as [number, number, number],
  },
};

/* ── The desk ────────────────────────────────────────────────────────────
   An ESTIMATE, and the only one in this file — say so rather than let the
   next agent read it as measured. The plate's own desk is photographed, so
   this plane is never drawn; it exists to be the ground props stand on and
   the surface their shadows will land on once anything casts one. Standard
   plate-compositing practice: the photograph is the set, the geometry is the
   stand-in.

   Calibrated off the ONE object in frame whose real size is known and whose
   top and bottom are both visible: the mouse. A full-size mouse is about 42mm
   tall, and in the plate its top edge sits at y≈820 and its foot at y≈905. An
   85px rise for 42mm of height puts it 0.84m from the camera, and its foot
   then puts the desk surface 0.181m below the axis. Cross-checks against the
   mat's depth to within a centimetre or so.

   The first pass guessed 0.14m by eye and the placeholder hand hovered 60px
   above the mouse it was supposed to be resting on — which is exactly the
   kind of error an estimate hides until something has to stand on it.

   For a new prop: switch on the debug wireframe (`?wire`), stand the prop on
   this plane, and match it to the plate by eye. That is the intended
   workflow, not a workaround — and if a prop floats, suspect this number
   before you suspect the prop. */
export const DESK = {
  /* Below the camera axis. */
  height: -0.181,
  width: 2.4,
  depth: 1.4,
  /* Centre of the plane, in front of the backdrop. */
  position: [0, -0.181, -0.95] as [number, number, number],
};

/* The backdrop, filling the design frustum exactly at the wall's depth. Its
   size and the camera's fov are locked together by `framing()` below, so the
   plate always covers the viewport and the monitor never drifts off it. */
const BACKDROP_DEPTH = 2.0;
export const BACKDROP = {
  depth: BACKDROP_DEPTH,
  height: 2 * BACKDROP_DEPTH * Math.tan(DESIGN_FOV / 2),
  get width() {
    return this.height * PLATE_ASPECT;
  },
  position: [0, 0, -BACKDROP_DEPTH] as [number, number, number],
};

/**
 * The camera's vertical fov for a given viewport aspect, in degrees.
 *
 * The plate has to cover the viewport the way `object-fit: cover` would, and
 * the monitor has to stay welded to the plate while it does. Scaling the
 * backdrop would slide the plate under the monitor; moving the camera would
 * change the perspective the plate was shot with. Changing fov does neither —
 * from a fixed eye point it is a pure scale about the frame's centre, so the
 * backdrop and the monitor grow and shrink together and the composite holds
 * at every window size.
 */
export function framing(viewportAspect: number): number {
  const visibleHeight =
    Math.min(BACKDROP.height, BACKDROP.width / viewportAspect) / FRAMING_ZOOM;
  return (2 * Math.atan(visibleHeight / (2 * BACKDROP.depth)) * 180) / Math.PI;
}

/**
 * The fraction of the viewport's width the monitor's glass covers — which is
 * also the scale the composited desktop ends up at. Reported in the PR and
 * used to size the screen's DOM so it is never asked to render at a size the
 * layout was not designed for.
 */
export function screenScreenFraction(viewportAspect: number): number {
  const fov = (framing(viewportAspect) * Math.PI) / 180;
  const visibleHeightAtScreen = 2 * -screenCentre.z * Math.tan(fov / 2);
  return SCREEN_WIDTH_M / (visibleHeightAtScreen * viewportAspect);
}

/* ── Props ───────────────────────────────────────────────────────────────
   A prop is a file that default-exports one of these. Add the file, add it to
   `props/index.ts`, give it a transform measured off the plate — and a
   hotspot if it should be reachable by keyboard. Nothing else.

   `Model` is a plain R3F component. It draws in its own local space around
   the origin; `transform` puts it in the room. Keeping those two apart is
   what makes a prop reusable and its placement reviewable. */
export type SceneProp = {
  /** Stable id — React key, and the handle for a future hotspot signal. */
  id: string;
  /** Plain-language name. Ends up in the accessible name if it has a hotspot. */
  label: string;
  /** Draws the prop around its own origin. Placement is `transform`'s job. */
  Model: ComponentType<{ palette: RoomPalette }>;
  transform: {
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
  };
  /** Optional: makes the prop reachable and operable without a mouse. */
  hotspot?: {
    /** Handled by `DeskRoom`; keeps props as data rather than callbacks. */
    signal: string;
    label: string;
    /** Where the control sits, in the prop's own space. */
    at: [number, number, number];
  };
};

/* The mouse: 0.84m from the camera, 0.20m right of centre, on the desk. Same
   solve as `DESK` above — this is the object that calibration was done
   against, so it is the one placement in the room that is not an estimate.
   The placeholder hand rests here because that is where the film's hand
   rests, and the rigged hand will pivot from here. */
export const MOUSE_POSITION: [number, number, number] = [0.196, DESK.height, -0.843];
