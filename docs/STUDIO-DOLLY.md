# /studio — Uncut Soundstage Dolly

> **Locked.** This file is the immutable source of truth for the twelve studio
> set-pieces: the roster, their order, their status, and the exact visual
> treatment each one gets. `docs/BLUEPRINT.md` still governs palette, voice and
> surface separation. Where this file and a generated asset disagree, this file
> wins and the asset gets regenerated.

## What we are building

`/studio` is a persistent, cinematic, single-take experience — one uncut dolly
shot that travels through twelve set-pieces in fixed order. It is not a
portfolio grid, not a card wall, not a scroll of previews.

**Rejected outright:** generic previews, flat cards, gradient soup, playful
illustration, template layouts.

**Required:** volumetric geometry, advanced lighting, physical material
simulation, single-take camera continuity.

## Style contract — every set-piece, no exceptions

Photoreal chiaroscuro against absolute black. Hard, precise, motivated light.
Deep shadow holding most of the frame. Simulation-grade materials — real
refraction, real subsurface, real specular falloff. The camera never cuts.

Status drives the treatment, and it is not optional:

| Status | Treatment |
|---|---|
| **LIVE / SHIPPED / SHIPPING** | The set is **pristine and resolved.** Clean geometry, settled light, finished materials. Nothing flickers. |
| **IN DEV / R&D** | The set is **raw, schematic, volatile.** Visible wireframe, glitch artifacts, missing geometry, unstable light. |

## The twelve — immutable roster, fixed order

No additions. No reordering. No status upgrades.

| # | Project | Status | Set-piece |
|---|---|---|---|
| 01 | **Just a Pinch** | LIVE | Stark, surgically lit, brilliant white minimalist kitchen counter against absolute black. A tablet displays the live pinch.shift9.dev interface. |
| 02 | **Flow State** | SHIPPING | A dark obsidian studio space. A perfectly clear vessel holds a glowing low-viscosity blue fluid in complex laminar flow. Lit to emphasise refraction. |
| 03 | **Learning App** | SHIPPING | A warm children's reading nook standing as an island of honey-coloured light in the black void: a low rounded play platform, a chunky tablet running a friendly early-reading interface, and three crocheted plush animal characters — fox, owl, rabbit — gathered around it. Real yarn fibre, real subsurface. **Revised 2026-07-25 at Kariim's direction**: this tile was previously frozen to supplied artwork; he asked for it to be generated to this brief instead. |
| 04 | **Lumen Projection Mapper** | IN DEV | A dark room. A large stack of plain white geometric boxes, centred, with a projector beam raking across them and dust motes in the light. **The clip is the point here** — it runs the real projection-mapping sequence you see on stage: calibration grid snapping onto the box faces and locking to the edges, then the mapped show taking over across a few distinct passes (a saturated acid-trip pass, a retro video-game pass, and a hard architectural deconstruction pass where the boxes appear to open, slide and collapse in light). In dev, so the calibration visibly fights before it locks and the map tears at the seams. Needs 10s. |
| 05 | **Voxel Arcade Basketball** | IN DEV | A retro-futuristic arcade cabinet against a dark brick wall. The screen shows pixel-art C# code. The cabinet flickers with neon electric blue and orange. |
| 06 | **Midnight Return** | IN DEV | A heavy metallic industrial corridor soundstage. Moody atmospheric lighting dominated by flickering saturated industrial blues and oranges. |
| 07 | **Game Design Forge** | R&D | A cluttered R&D workbench. Screens show raw C# code and engine schematics. Soldering iron visible. Accent light is deep, hot orange. |
| 08 | **Titanium Forge Pro** | IN DEV | A brutalist steel structure: a massive raw titanium press actively extruding metal geometry, glowing white-hot. **Revised 2026-07-25 at Kariim's direction**: the earlier generation is no longer referenced anywhere; Titanium Forge Pro is v1. |
| 09 | **INSTRUMENT** | LIVE | A dark monolithic soundstage. A massive minimalist sculptural form — a brutalist synthesizer — centred, pulsing with soft rhythmic electric blue. |
| 10 | **Automation Systems** | LIVE | A clean sterile data centre. Server racks receding into darkness. A single perfectly resolved robotic arm performing a precise repetitive assembly task. |
| 11 | **Omni-3D** | IN DEV | A dark warehouse. A volumetric 3D humanoid mech projected in air — unfinished and glitching, visible wireframe artifacts and missing geometry. |
| 12 | **WinFix** | SHIPPED | A minimalist high-contrast white room. A single resolved glowing wrench/gear icon floating centre. Clinical, precise lighting. |

## Known errata in the reference grid

- The master grid **mislabels tile 04** as "05 Voxel Arcade Basketball." Tile 04
  is **Lumen Projection Mapper**. The roster above is correct; the grid is not.
- The grid's Learning App tile is **superseded**. It was first replaced by
  supplied artwork; on 2026-07-25 Kariim lifted the freeze and asked for the
  tile to be generated to the brief now in the roster above.
- Roster status for 03 reads SHIPPING here, matching the grid and the app's
  existing project data. An earlier note called it "shipped" — SHIPPING stands
  until Kariim says otherwise.

## How the twelve become the dolly

**All twelve are animated.** Every set-piece is a moving shot, not a still —
something genuinely happens in each one. The still is only the plate.

Two steps per project, in this order:

1. **The plate.** A 16:9 still, approved by Kariim. This locks the composition,
   the lighting and the framing so the whole set stays consistent.
2. **The clip.** The approved plate is the start frame for an image-to-video
   pass, so the geometry, palette and framing carry over exactly. The camera
   stays locked or barely pushes — the *subject* moves, not the shot. Silent;
   audio is handled separately if at all.

The fly-through is assembled from the complete approved set afterwards, in one
pass, via the skill built for it. Nothing is assembled from a partial set — it
would only have to be rebuilt when a later tile lands.

Working order: shoot the plate → keep or refine → animate it → keep or refine →
save both to `public/experience/set-pieces/` → next project.

### What moves, per status

- **LIVE / SHIPPED / SHIPPING** — the motion is smooth, resolved, hypnotic, in
  control. Nothing stutters. The set is behaving exactly as designed.
- **IN DEV / R&D** — the motion is unstable: glitch, tear, flicker, geometry
  resolving and failing, wireframe popping in and out. The set is visibly
  mid-build.

### Model and cost

`kling3_0`, `mode: pro`, `sound: off`, start frame = the approved plate.

| Item | Credits |
|---|---|
| Plate (4K still) | 4 |
| Clip, 5s | 8.75 |
| Clip, 10s | 17.5 |
| **Twelve plates + twelve 5s clips** | **~153** |
| Same, if every clip runs 10s | ~258 |

Seedance at 1080p costs 45 per clip for the same 5 seconds. It is not worth 5×
for this material — the plate is already carrying the detail.

## Entry-experience architecture this plugs into

Decided and locked. The dolly is one stage of a larger front door.

| Stage | Implementation |
|---|---|
| Linear film beats (character walks in, sits down) | Generated video, 1080p |
| The monitor screen | **Real HTML/CSS/JS — never video.** Crisp, clickable, free to change. |
| Hardware dive (clicking the SHIFT-9 icon) | One generated clip, reused on every click |
| Room exploration | Still viewpoints with clickable hotspots |
| The twelve set-pieces | The uncut dolly — this document |

**Character swap path.** The crocheted amigurumi character appears *only* in the
opening beats. A "character pack" is those clips alone. A new outfit or a
different character means: new reference image → regenerate that pack → drop it
in. Nothing else in the experience is touched. Keep that boundary intact.

**The character is locked.** Crocheted amigurumi doll: black cap with **no hair**
under it, black PUSHERS hoodie, silver chain, beaded bracelets, ripped black
jeans, grey and orange sneakers, silver watch. Yarn look on him; hyper-realistic
world around him. Nothing but the hair changes.
