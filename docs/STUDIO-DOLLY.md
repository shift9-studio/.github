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
| 03 | **Learning App** | SHIPPING | A minimalist floating cubic structure in architectural concrete. Clean sharp internal light reveals a geometric UI projected onto the cube's inner walls. **Artwork is supplied — never regenerate this tile.** |
| 04 | **Lumen Projection Mapper** | IN DEV | A dark room. A complex abstract wireframe object centred. A sharp powerful light ray projects a live, glitching UI map onto it. Dust motes catch the beam. |
| 05 | **Voxel Arcade Basketball** | IN DEV | A retro-futuristic arcade cabinet against a dark brick wall. The screen shows pixel-art C# code. The cabinet flickers with neon electric blue and orange. |
| 06 | **Midnight Return** | IN DEV | A heavy metallic industrial corridor soundstage. Moody atmospheric lighting dominated by flickering saturated industrial blues and oranges. |
| 07 | **Game Design Forge** | R&D | A cluttered R&D workbench. Screens show raw C# code and engine schematics. Soldering iron visible. Accent light is deep, hot orange. |
| 08 | **Neon Forge → Titanium Forge Pro** | V1 SHIPPED · V2 IN DEV | A brutalist steel structure. V1 is a resolved glowing neon armature. V2 is a massive raw titanium press actively extruding metal geometry, glowing white-hot. |
| 09 | **INSTRUMENT** | LIVE | A dark monolithic soundstage. A massive minimalist sculptural form — a brutalist synthesizer — centred, pulsing with soft rhythmic electric blue. |
| 10 | **Automation Systems** | LIVE | A clean sterile data centre. Server racks receding into darkness. A single perfectly resolved robotic arm performing a precise repetitive assembly task. |
| 11 | **Omni-3D** | IN DEV | A dark warehouse. A volumetric 3D humanoid mech projected in air — unfinished and glitching, visible wireframe artifacts and missing geometry. |
| 12 | **WinFix** | SHIPPED | A minimalist high-contrast white room. A single resolved glowing wrench/gear icon floating centre. Clinical, precise lighting. |

## Known errata in the reference grid

- The master grid **mislabels tile 04** as "05 Voxel Arcade Basketball." Tile 04
  is **Lumen Projection Mapper**. The roster above is correct; the grid is not.
- The grid's Learning App tile is **superseded** by the supplied replacement
  artwork. Use the supplied file; do not regenerate.
- Roster status for 03 reads SHIPPING here, matching the grid and the app's
  existing project data. An earlier note called it "shipped" — SHIPPING stands
  until Kariim says otherwise.

## How the twelve become the dolly

**Decided:** each set-piece is delivered as a still, approved one at a time. The
fly-through is assembled from the full approved set afterwards, in one pass, via
the skill built for it. Nothing is animated per-tile in isolation and nothing is
assembled before all twelve are signed off — a fly-through built from a partial
set would have to be rebuilt the moment a later tile lands.

So the working order is: shoot one → Kariim keeps or refines → save it to
`public/experience/set-pieces/` → next. Twelve approved stills, then the
fly-through.

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
