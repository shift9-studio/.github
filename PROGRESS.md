# PROGRESS — `claude/shift9-3d-desk-scaffold-4twb21`

> State of the 3D-desk branch, written so a cold agent can resume without briefing.
> `CLAUDE.md` = how to work here. `docs/BLUEPRINT.md` = locked creative direction.
> `HANDOFF.md` = repo-wide continuity. **This file = this branch.**

**Last updated:** 2026-07-29
**Branch:** `claude/shift9-3d-desk-scaffold-4twb21`
**Base:** `adb29c8` — the entry experience is **merged** (PR #36). This branch
continues from it, which is why the previous contents of this file (the
entry-experience branch, PR #35) are gone rather than appended to.
**Scope:** 11 files. New: `app/_components/desk3d/` (7 files),
`scripts/build-handoff-plate.py`, one generated JPEG. Modified:
`EnterTheStudio.tsx` + `.module.css`, `packages/theme/tokens.css`,
`apps/shift9-dev/package.json`, `pnpm-lock.yaml`.

---

## What this branch is

The entrance used to play a 20-second film and then cut to a desktop UI filling
the browser. Now the film stops on the frame before the crocheted hand reaches
the mouse, and a **3D room** takes over from that frame — the same desk, the
same monitor, with the live interactive desktop composited onto the monitor's
glass in perspective. The desktop becomes a screen in a room instead of a page.

This is the **scaffold**. The hand is a placeholder, nothing animates, and the
camera does not move.

| Piece | Where | What it is |
|---|---|---|
| The measurements | `desk3d/scene.ts` | Every number the room is built from, and how each was arrived at. No React. |
| The scene graph | `desk3d/DeskScene.tsx` | Backdrop, monitor, desk, lights, props, hotspot projection. |
| The composite | `desk3d/ScreenSurface.tsx` | The live desktop on the glass, via three's `CSS3DRenderer`. |
| The DOM side | `desk3d/DeskRoom.tsx` | Portal host, hotspot buttons, the way back out. |
| The gate | `desk3d/useRoomCapable.ts` | Three-free, so phones never download a renderer. |
| Materials | `desk3d/palette.ts` | Reads the room's tokens off the document at runtime. |
| Props | `desk3d/props/` | One file per prop. `hand.tsx` is the worked example. |
| The plate | `scripts/build-handoff-plate.py` | Cuts the backdrop out of the film. Owns the file — do not hand-replace it. |

## How the geometry was solved (do not re-guess this)

The monitor is **not** placed by eye. Its glass's four corners were read off the
plate at 5× zoom, and the panel's pose is solved from them in closed form:

- each edge's real width (0.80m — a 34" ultrawide) over its pixel width gives
  that edge's depth,
- the two edge depths give the panel's height, its lean, and its centre.

Solving per-edge rather than from the quad's centre matters: perspective is not
linear, so the centre of a projected quad is not the projection of the centre.
The first version used the centroid and sat the top edge ~0.7% low — a 9px black
slit above the desktop at 2560. **Measured now: within 2.1px at every size
tested**, with the top edge correctly wider than the bottom (the panel leans its
top toward the camera).

The **desk plane is the one estimate** in the file, and it is labelled as such.
It is calibrated off the mouse — the only object in frame whose real size is
known and whose top and bottom are both visible — which puts the surface 0.181m
below the camera axis. An earlier eyeballed 0.14m left the placeholder hand
hovering 60px above the mouse it was meant to rest on.

`?wire` on the page draws the stand-in geometry, which is how the next prop
should be placed.

## The handover, and why it is built the way it is

`HANDOFF_AT_S = 8.45` stops playback; the hand enters at 8.5.

**Stopping a video on a chosen frame is not exact.** The callback fires after a
frame is already composited, so the real stop drifts with machine load. Measured
across three runs on one box: 8.473, 8.521, 8.484 — and 8.521 is *past* the hand.

So the frame is not guaranteed by the stop. It is guaranteed by a still: the
plate is mounted transparent when the film starts, spends the next eighteen
seconds being fetched and decoded, and is revealed in the same commit as the
pause. Verified: at the instant playback stops the image is in the page, decoded,
and full width, and is at opacity 1 one frame later. The video is also rewound to
`PLATE_AT_S` as a second line of defence.

**The mp4 is untouched.** This is a playback stop, not an edit.

## Adding a prop later

A file, a transform, and a hotspot — nothing else:

1. `desk3d/props/<name>.tsx` default-exporting a `SceneProp`,
2. a `transform` measured against `?wire`,
3. a `hotspot` if it should be operable without a mouse,
4. add it to the array in `props/index.ts`.

**Where a prop may go is constrained.** CSS3D content is composited above the
WebGL layer, always — so nothing drawn in WebGL can pass in front of the
monitor's glass. Props belong on the desk or further into the room. A prop that
must occlude the screen has to be DOM too.

## Verified on 2026-07-29, against this exact HEAD

| Check | Result |
|---|---|
| `pnpm --filter shift9-dev build` / `just-a-pinch build` | exit 0, both, no `.env` anywhere in the repo |
| `pnpm typecheck` | exit 0, both apps. No new `any`, no ts-suppressions |
| Every route at 1280 / 768 / 390 | `/`, `/studio`, `/start`, `/soon`, `/instrument` — all 200, **zero** console errors, `scrollWidth === clientWidth` (no horizontal overflow) |
| Composite alignment | **2.1px worst-case** corner drift at 1280×800, 1440×900, 1920×1080, 1600×1200, 2560×1440; top edge wider than bottom at all five (the lean is right, not just the bounding box) |
| Keyboard | 22 of 24 tab stops land inside the composited screen; the full-size hotspot is in the tab order and works |
| `prefers-reduced-motion` | Room renders, complete and legible, film skipped. Frame **pixel-identical across 1.2s** — nothing is animating |
| WebGL disabled (actually, via `--disable-webgl`) | Falls back to today's full-bleed desktop. 5 tiles, 0 errors |
| The 8.45s stop | Driven end-to-end with a timing-identical WebM stand-in (this box has no H.264 decoder). Never reached 8.5; plate decoded and covering at the stop, 3/3 runs |
| Added page weight | **+0.37 MB** on a desktop that gets the room (231 KB JS, 144 KB plate). **0 MB** on a phone or a machine without WebGL — the room is a dynamic import |
| Tokens | Zero raw hex and zero raw durations outside `tokens.css`; four new room tokens added there |

## Two bugs this branch found and fixed in existing code

- **`enterDesk` never set `mode`.** Harmless while the desk was the only
  destination; a real bug the moment there were two — a browser that could not
  decode the opening got the flat desktop even when it could have had the room.
- **A `useFrame` priority above 0 takes R3F's render loop away from it.** The
  first version rendered the CSS layer at priority 1 and never called
  `gl.render`, so the room drew nothing while the composited desktop worked
  perfectly. Both passes are now rendered explicitly, in order.

## Known, and deliberately not solved here

- **The desktop is small.** At the film's own framing the glass is 55–61% of the
  viewport width, so the interface renders at that scale: 14.5px tile names read
  as ~8px, 11.5px sub-labels as ~7px. That is the cost of the desktop being a
  screen in a room, and it is not something the room can fix — the room is the
  reason. The escape hatch is the **"View the desktop full size"** hotspot on the
  bezel, which is in the tab order and returns the full-bleed desktop.
- **`FRAMING_ZOOM` cannot rescue it.** It tops out at **1.14**: the zoom is a fov
  change about the centre of frame and the glass sits above centre, so pushing in
  eats the top of the monitor first. Rendered at 1.5 to confirm — the top third
  of the screen is gone. Zooming about the screen instead needs
  `camera.setViewOffset`, which shifts the principal point, which slides the
  CSS3D composite off the glass. Getting properly closer needs a re-shot beat.
- **The lamp no longer lights the screen.** In the plate the desk lamp washes the
  top of the monitor; the composited desktop replaces that, so the monitor reads
  as slightly unlit by its own room. Fixing it means a DOM overlay on the screen,
  which trades contrast for realism — a call, not an oversight.
- **The film's own beat still runs to 10.04s on phones and on machines without
  WebGL.** They get the full film and the approved screen-wake, unchanged. Only
  the room path stops early, because only the room path has somewhere to go.

## Not built — out of scope for a scaffold

- The rigged crocheted hand (this one is five boxes).
- Any camera move. The backdrop is a flat photograph of a room; move the camera
  and the whole room slides as one card.
- The 3D printer and projector wall.

---

## Rules that bite on this branch specifically

- Tokens only — the diff was checked; keep it that way. The 3D materials read
  the tokens off the document rather than duplicating them.
- The room must never be the only way in: WebGL, pointer and size are all gated,
  and the flat desktop is the fallback everywhere.
- `04-desk-handoff-plate.jpg` is generated. Change `PLATE_AT` in
  `scripts/build-handoff-plate.py` and rerun; keep it equal to `PLATE_AT_S`.
- Never push to `main`; never self-merge.
