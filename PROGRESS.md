# PROGRESS — `claude/shift9-3d-desk-scaffold-4twb21`

> State of the 3D-desk branch, written so a cold agent can resume without briefing.
> `CLAUDE.md` = how to work here. `docs/BLUEPRINT.md` = locked creative direction.
> `HANDOFF.md` = repo-wide continuity. **This file = this branch.**

**Last updated:** 2026-07-30
**Branch:** `claude/shift9-3d-desk-scaffold-4twb21`
**Base:** `adb29c8` — the entry experience is **merged** (PR #36). This branch
continues from it, which is why the previous contents of this file (the
entry-experience branch, PR #35) are gone rather than appended to.
**Scope:** 14 files. New: `app/_components/desk3d/` (7 files),
`scripts/build-handoff-plate.py`, `scripts/build-crocheted-hand.py` + its
run-card, one generated JPEG, one generated `.glb`. Modified:
`EnterTheStudio.tsx` + `.module.css`, `packages/theme/tokens.css`,
`apps/shift9-dev/package.json`, `pnpm-lock.yaml`.

---

## What this branch is

The entrance used to play a 20-second film and then cut to a desktop UI filling
the browser. Now the film stops on the frame before the crocheted hand reaches
the mouse, and a **3D room** takes over from that frame — the same desk, the
same monitor, with the live interactive desktop composited onto the monitor's
glass in perspective. The desktop becomes a screen in a room instead of a page.

This is the **scaffold**. Nothing animates and the camera does not move. The
hand is modelled and textured but not yet rigged.

| Piece | Where | What it is |
|---|---|---|
| The measurements | `desk3d/scene.ts` | Every number the room is built from, and how each was arrived at. No React. |
| The scene graph | `desk3d/DeskScene.tsx` | Backdrop, monitor, desk, lights, props, hotspot projection. |
| The composite | `desk3d/ScreenSurface.tsx` | The live desktop on the glass, via three's `CSS3DRenderer`. |
| The DOM side | `desk3d/DeskRoom.tsx` | Portal host, hotspot buttons, the way back out. |
| The gate | `desk3d/useRoomCapable.ts` | Three-free, so phones never download a renderer. |
| Materials | `desk3d/palette.ts` | Reads the room's tokens off the document at runtime. |
| Props | `desk3d/props/` | One file per prop. `hand.tsx` is the worked example. |
| The hand | `scripts/build-crocheted-hand.py` + `.runcard.md` | Owns the model. Do not hand-edit the `.glb`. |
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
slit above the desktop at 2560. **Measured now: within 2.4px at every size
tested**, with the top edge correctly wider than the bottom (the panel leans its
top toward the camera).

The **desk plane is the one estimate** in the file, and it is labelled as such.
It is calibrated off the mouse — the only object in frame whose real size is
known and whose top and bottom are both visible — which puts the surface 0.181m
below the camera axis. An earlier eyeballed 0.14m left the hand
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

## Verified on 2026-07-30, against this exact HEAD

| Check | Result |
|---|---|
| `pnpm --filter shift9-dev build` / `just-a-pinch build` | exit 0, both, run with the Supabase vars explicitly unset |
| `pnpm typecheck` | exit 0, both apps. No new `any`, no ts-suppressions |
| Every route at 1280 / 768 / 390 | `/`, `/studio`, `/start`, `/soon`, `/instrument` — all 200, **zero** console errors, `scrollWidth === clientWidth` (no horizontal overflow) |
| The enlarged monitor fits | Glass flooded and its bounding box measured against the viewport at **nine sizes, 4:3 → 21:9**. Every size the room admits is clear on all four edges; tightest is 1280×800 with **24px to spare**. Sizes outside the gate are correctly refused the room |
| The forearm leaves frame | Open end off-screen at 1280×800, 1440×900, 1920×1080, 2560×1440 and 2560×1280 (2:1, the widest admitted) |
| Keyboard | 22 of 24 tab stops land inside the composited screen; the full-size hotspot is in the tab order and works |
| `prefers-reduced-motion` | Room renders, complete and legible, film skipped. Frame **pixel-identical across 1.2s** at 1280 and 390 — nothing is animating |
| WebGL disabled (actually, via `--disable-webgl`) | Falls back to today's full-bleed desktop. 5 tiles, 0 errors |
| The 8.45s stop | Stopped at **8.451s**, furthest the film played **8.439s** (the hand enters at 8.500). Plate decoded and covering before the stop could be seen |
| Added page weight | **+0.55 MB** on a desktop that gets the room (252 KB JS, 167 KB hand model, 144 KB plate). **0 MB** on a phone or a machine without WebGL — the room is a dynamic import |
| Tokens | Zero raw hex and zero raw durations outside `tokens.css`; six room tokens there |

## Two bugs this branch found and fixed in existing code

- **`enterDesk` never set `mode`.** Harmless while the desk was the only
  destination; a real bug the moment there were two — a browser that could not
  decode the opening got the flat desktop even when it could have had the room.
- **A `useFrame` priority above 0 takes R3F's render loop away from it.** The
  first version rendered the CSS layer at priority 1 and never called
  `gl.render`, so the room drew nothing while the composited desktop worked
  perfectly. Both passes are now rendered explicitly, in order.

## Known, and deliberately not solved here

- **The monitor is the room's own now, not the photograph's.** Up to 2026-07-30
  the glass was welded to the film's 34" panel, which capped the desktop at 54%
  of the frame. The scene now models a larger panel — **1.52x**, a ~52" ultrawide
  — with a bezel and shell behind it, covering the photographed one completely.
  Glass is **83–92% of viewport width** and the small mono labels land near 11px.
- **It grows DOWNWARD, and that is forced.** Scaled about its own centre it
  clipped at every viewport, because the photographed panel's top edge sits 70px
  from the top of a 1076px frame — symmetric growth runs off the top at 1.31x.
  There is no framing trick that buys headroom; above the monitor there are 70
  pixels of wall and then the edge of the film. So the top edge is pinned where
  the photograph's is and the glass extends into the stand-and-plants space
  below. That space is decoration; the top of frame is a wall.
- **The room now refuses windows outside 8:5 – 2:1**, and this is a real trade.
  Narrower and the side-crop takes the glass's left edge off frame; wider and the
  photographed monitor's own top edge is already outside the frame *at any panel
  size*, 34" included. Both measured. Outside the bounds the flat desktop is the
  site — the same proven fallback a machine without WebGL gets. Letterboxing the
  plate would keep the room on ultrawides, but the film's beat is
  `object-fit: cover` and black bars appearing on the handover frame would make
  the locked cut visible.
- **The push-in is gone.** `COMPOSITION` is the whole plate, so `FRAMING_ZOOM`
  is exactly 1. It existed to make the desktop readable while the monitor was
  stuck at the photograph's size; the bigger panel supplies that for free, and
  the crop was magnifying a 1928px still and softening the room to buy it. The
  machinery is intact and measured — narrow the rect again if the room ever needs
  to push in for a different reason.
- **The hand is revision 3, and its run-card records all 13 passes.** Revision 2
  had correct fingers that were invisible in the room: the palm was flat where
  the film's is arched over the mouse, so the forearm's silhouette cut straight
  across the knuckles. Fixed by arching the palm 18mm, cutting the sleeve's rib
  back to a 34mm band with plain chunky knit past it, lengthening the forearm to
  340mm so its open end is never on screen, and choosing the prop's rotation by
  screenshotting six values *in the room*.
- **The room's lighting gained the monitor.** Both existing lights sit deeper in
  the room than the props do, so the nearest object to the camera — the forearm —
  was lit only along its top edge and read as a black slab. A screen glow and a
  dim bounce off the room behind the viewer now exist. Neither can touch the
  plate: the backdrop is `meshBasicMaterial` and unlit by construction.
- **The lamp no longer lights the screen.** In the plate the desk lamp washes the
  top of the monitor; the composited desktop replaces that, so the monitor reads
  as slightly unlit by its own room. Fixing it means a DOM overlay on the screen,
  which trades contrast for realism — a call, not an oversight.
- **The film's own beat still runs to 10.04s on phones and on machines without
  WebGL.** They get the full film and the approved screen-wake, unchanged. Only
  the room path stops early, because only the room path has somewhere to go.

## Not built — out of scope for a scaffold

- **Rigging the hand.** It is modelled and placed but static; the armature that
  makes it follow the pointer is the next step.
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
