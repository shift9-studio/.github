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
  screen: string;
  shell: string;
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
const SCREEN_MEASURED_WIDTH_M = 0.7998;

/* ── A BIGGER MONITOR ────────────────────────────────────────────────────
   Kariim's call: the monitor should be a lot bigger.

   Up to now the screen was welded to the monitor in the photograph — solved
   from its corners, exactly its size. That is what kept the composite honest,
   and it is also what capped the desktop at ~54% of the frame, because the film
   frames a 34" panel at 54% of the frame and no amount of arithmetic changes
   what the camera saw.

   So the scene stops borrowing the photograph's monitor and brings its own: a
   larger panel, standing where that one stood, with a modelled bezel and shell
   behind it (`BEZEL` below, drawn in DeskScene). It covers the photographed
   monitor completely, so there is no double-monitor and nothing to mask — the
   plate still supplies the desk, the wall, the mat, the keyboard, the speaker
   and the lamp, which is everything the room is actually for.

   ── WHICH WAY IT GROWS, and why that is the whole problem ─────────────────
   The first attempt scaled the glass about its own centre. Every viewport
   clipped, and 4:3 clipped on all four sides. The reason is in the plate and
   cannot be argued with: the photographed panel's top edge sits 70px from the
   top of a 1076px frame. Grow it symmetrically and the top leaves frame at
   1.31x — before it has grown enough to matter. Measured, at five sizes, not
   reasoned about.

   And there is no framing trick that buys headroom. `crop()` can slide the
   window over the plate, but it cannot show what the camera never shot; above
   the monitor there are 70 pixels of wall and then the edge of the film.

   So the panel grows DOWNWARD — its top edge pinned exactly where the
   photograph's is, its glass extending into the space below, which in the plate
   holds the stand and two plants. That space is decoration; the top of frame is
   a wall. Trading the plants for a monitor twice the area is the right trade,
   and it is the only one available.

   A big panel on a low stand is also just what this looks like in a real room.

   1.52 is the largest scale at which nothing clips at any aspect the room
   admits — found by flooding the glass magenta and measuring its bounding box
   against the viewport at nine sizes from 4:3 to 21:9, not chosen. It puts a
   ~52" ultrawide where the 34" was: glass across ~83% of the viewport width
   against 54% before, so the composited desktop renders at 83% linear scale and
   its small mono labels land near 11px instead of 7px.

   The binding case is a 16:10 window, where the glass's LEFT edge runs out of
   frame first — the photographed panel sits 37px left of the plate's centre, so
   it grows into the left margin sooner than the right. The bezel is drawn
   outside the glass and has to fit too, which is what the last 0.02 of slack is
   for. Both aspect bounds are enforced by `useRoomCapable`; outside them the
   flat desktop is the site. */
const SCREEN_SCALE = 1.52;

const SCREEN_WIDTH_M = SCREEN_MEASURED_WIDTH_M * SCREEN_SCALE;

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

/* ── How close the room sits ─────────────────────────────────────────────
   The film frames the monitor at 55% of the width, with a lot of desk and
   wall around it. Composited at that framing the desktop renders at 55% scale
   and its small labels land near 7px, which nothing can read. So the room
   pushes in — but only as far as it can without throwing away the things the
   shot is of.

   That is what this rect is: the region of the plate that MUST stay on
   screen. The zoom is derived from it rather than dialled by eye, so the
   framing can never quietly crop something that matters.

     top     the monitor's top edge, y=70, plus a margin of wall
     bottom  the mouse at y=905 — where the hand rests, and the hand is a
             prop now, not a placeholder; cropping it out to gain a few
             percent of type size would be trading the wrong thing
     sides   the desk, wide enough to keep both plants and the second monitor
             reading as a room rather than as wallpaper

   Which yields ~1.25x, and a desktop at ~68% instead of 55%. It is bounded,
   and worth saying plainly: keeping the whole monitor AND the hand in frame
   is what stops it going further. Drop the hand from the composition and it
   would reach ~1.5x; drop the room and you are back to a full-bleed page.

   HOW the zoom is applied matters as much as its value. It is NOT a fov
   change — a fov change scales about the centre of frame, and the monitor
   sits well above centre, so pushing in that way eats the screen's top edge
   first (measured: it leaves frame at 1.15x). And it is NOT
   `camera.setViewOffset`, which shifts the projection's principal point and
   slides the CSS3D composite off the glass it is welded to.

   Instead the scene renders a LARGER frame and the viewport shows a window
   onto it — see `crop()`. Both layers, WebGL and CSS3D, render at the same
   enlarged size with the same untouched camera and are offset together, so
   the composite cannot come apart; the crop is pure CSS. The cost is honest
   and only one: the plate is 1928px and gets magnified, so the room is
   proportionally softer. */
/* The whole plate, which makes the derived zoom exactly 1 — no push-in at all.
   The push-in existed to make the desktop readable when the monitor was stuck
   at the photograph's size. The monitor is its own object now and 1.55x bigger,
   so the crop is not needed and is actively unwanted: it magnified a 1928px
   still and softened the room for a gain the bigger panel supplies for free.
   Narrow this rect again if the room ever needs to push in for a different
   reason; the machinery is intact and measured. */
const COMPOSITION = { left: 0, right: PLATE_W, top: 0, bottom: PLATE_H };

/** How much larger than the viewport the scene renders. Derived, not chosen. */
export const FRAMING_ZOOM = Math.min(
  PLATE_W / (COMPOSITION.right - COMPOSITION.left),
  PLATE_H / (COMPOSITION.bottom - COMPOSITION.top),
);

/**
 * Where the viewport's window sits on the enlarged frame, in CSS pixels.
 *
 * The window is centred on the composition rect and then clamped inside the
 * rendered frame, so it can never show past the plate's edge.
 */
export function crop(viewportW: number, viewportH: number) {
  const width = viewportW * FRAMING_ZOOM;
  const height = viewportH * FRAMING_ZOOM;
  const centre = {
    x: (COMPOSITION.left + COMPOSITION.right) / 2 / PLATE_W,
    y: (COMPOSITION.top + COMPOSITION.bottom) / 2 / PLATE_H,
  };
  const clamp = (v: number, max: number) => Math.min(Math.max(v, 0), Math.max(max, 0));
  return {
    width,
    height,
    left: -clamp(centre.x * width - viewportW / 2, width - viewportW),
    top: -clamp(centre.y * height - viewportH / 2, height - viewportH),
  };
}

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
/* MEASURED width, not the scaled one. The solve is asking "how far away is a
   0.80m panel that covers 1045px?" — feed it the enlarged width and it answers
   with a proportionally greater depth, which lands a bigger monitor at exactly
   the same size on screen. The scale is applied to the geometry afterwards. */
const topDepth = (FOCAL_PX * SCREEN_MEASURED_WIDTH_M) / topWidthPx;
const bottomDepth = (FOCAL_PX * SCREEN_MEASURED_WIDTH_M) / bottomWidthPx;

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
const screenMeasuredHeightM = Math.hypot(
  topEdge.y - bottomEdge.y,
  topEdge.z - bottomEdge.z,
);
/* ── HOW BIG THE PANEL CAN BE IN *THIS* WINDOW ────────────────────────────
   The scale is not a constant, and the reason it stopped being one is a real
   defect that shipped: the first version of the bigger monitor picked one scale
   and then GATED the room off for any window whose aspect that scale did not
   suit. A maximised browser on a 1080p display has a viewport near 1920x937 —
   aspect 2.05 — which fell outside the gate, so the single most common desktop
   setup there is got no room at all. The feature was invisible to the person
   who asked for it.

   The lesson is the one this file keeps teaching: derive it, do not pick it.
   The panel is now as large as the window can actually hold, so every window
   gets a room and the room is as big as that window allows.

   What binds, exactly:

   · WIDE windows (aspect above the plate's 1.792) crop the plate's top and
     bottom. The glass's top edge is PINNED at plate y=70 and does not move with
     the scale, so this constraint is completely independent of how big the
     panel is — above ~2.06 the film's own monitor has its top edge off frame at
     any size, the photographed 34" one included. Nothing here can change that,
     and it is not a reason to withhold the room.

   · NARROW windows crop the plate's sides, and that IS scale-dependent: the
     glass grows sideways as it grows, so the left edge (the tighter of the two
     — the photographed panel sits 37px left of the plate's centre) runs out of
     frame first. Solving `left edge >= visible left edge` for the scale gives
     the expression below; 18px is the modelled bezel, which has to fit too.

   Clamped to [1, SCREEN_SCALE]: never bigger than the size that was verified by
   measurement, and never smaller than the photographed panel it has to cover. */
export function screenScale(viewportAspect: number): number {
  const halfVisibleWidthPx = (PLATE_H * viewportAspect) / 2;
  const leftMarginPx = cx - Math.min(halfVisibleWidthPx, PLATE_W / 2);
  const glassCentrePx = (SCREEN_CORNERS.tl[0] + SCREEN_CORNERS.tr[0]) / 2;
  const BEZEL_PX = 18;
  const fits = (glassCentrePx - leftMarginPx - BEZEL_PX) / (topWidthPx / 2);
  return Math.max(1, Math.min(SCREEN_SCALE, fits));
}

/* The panel's pose at a given scale. Everything is derived from the two solved
   edges; only the bottom one moves.

   The bottom edge slides down the panel's OWN plane. Down the plane, not down
   the world: the panel leans, so the edge has to travel along the lean or the
   enlarged glass would be a different shape from the one that was solved and
   the composite would shear. Sliding the bottom edge and leaving the top alone
   is what "grows downward" means in three dimensions — the top edge, the tilt
   and the depth all stay exactly as measured, so the part of the panel that
   overlaps the photograph still lands on the photograph. */
/* Positive: a +X rotation in three.js swings the plane's top edge toward a
   camera on +Z, which is the direction the widths say the panel leans. Getting
   this backwards is invisible in a bounding box — both signs give the same
   outer rectangle, one just has the wide edge at the wrong end — so it has to
   be checked against the top and bottom edge widths separately, and is. */
const screenTilt = Math.atan2(topEdge.z - bottomEdge.z, topEdge.y - bottomEdge.y);

export type ScreenPose = {
  width: number;
  height: number;
  aspect: number;
  position: [number, number, number];
  rotation: [number, number, number];
  hotspot: { signal: string; label: string; at: [number, number, number] };
};

/**
 * The monitor, sized for a viewport of this aspect. Position is the glass's
 * centre; the rotation is the panel's measured lean.
 *
 * A function rather than a constant because the panel's size depends on the
 * window — see `screenScale`. It is cheap and pure, so callers recompute it on
 * resize rather than caching it.
 */
export function screen(viewportAspect: number): ScreenPose {
  const scale = screenScale(viewportAspect);
  const width = SCREEN_MEASURED_WIDTH_M * scale;
  const height = screenMeasuredHeightM * scale;
  const bottom = {
    x: bottomEdge.x,
    y: topEdge.y + (bottomEdge.y - topEdge.y) * scale,
    z: topEdge.z + (bottomEdge.z - topEdge.z) * scale,
  };
  return {
    width,
    height,
    aspect: width / height,
    position: [
      (topEdge.x + bottom.x) / 2,
      (topEdge.y + bottom.y) / 2,
      (topEdge.z + bottom.z) / 2,
    ],
    rotation: [screenTilt, 0, 0],
    /* The way back to a full-size desktop.

       Compositing the desktop into the monitor shrinks it, and no amount of
       enlarging the panel makes it 100%. So the full-size desktop stays one
       keypress away, and this is where that control lives — on the bezel below
       the glass rather than over it, so it never sits on top of the thing it is
       offering to enlarge.

       Lower LEFT. It was on the right until the panel grew: the bigger glass
       reaches much further down the desk, and its lower-right corner now lands
       exactly on the mouse, so the label was printing across the crocheted
       hand. The left corner is over empty mat. */
    hotspot: {
      signal: "full-size",
      label: "View the desktop full size",
      at: [-0.42, -0.5 * height - 0.028, 0.004],
    },
  };
}

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
  const visibleHeight = Math.min(BACKDROP.height, BACKDROP.width / viewportAspect);
  return (2 * Math.atan(visibleHeight / (2 * BACKDROP.depth)) * 180) / Math.PI;
}

/**
 * The fraction of the viewport's width the monitor's glass covers — which is
 * also the scale the composited desktop ends up at. Reported in the PR and
 * used to size the screen's DOM so it is never asked to render at a size the
 * layout was not designed for.
 */
/* The modelled bezel and shell — what makes the enlarged glass read as a
   monitor in the room rather than a rectangle hanging in front of one. Drawn in
   DeskScene, and drawn AROUND the glass: CSS3D composites above WebGL, so
   nothing here may overlap the screen or it would be painted over. */
export const BEZEL = {
  /* A big panel wears a slim bezel — 14mm on 1.24m of glass. */
  border: 0.014,
  /* The shell behind, a little deeper than the bezel so the panel has body. */
  depth: 0.034,
};

export function screenScreenFraction(viewportAspect: number): number {
  const panel = screen(viewportAspect);
  const fov = (framing(viewportAspect) * Math.PI) / 180;
  const visibleHeightAtScreen = 2 * -panel.position[2] * Math.tan(fov / 2);
  return (panel.width / (visibleHeightAtScreen * viewportAspect)) * FRAMING_ZOOM;
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
