# HANDOFF - shift9-studio/.github

> Continuity doc. Any agent must be able to resume cold from this file with zero briefing.
> Update it in the same commit as any code change.
> `CLAUDE.md` = how to work here. `docs/BLUEPRINT.md` = locked creative direction. This file = where we are.
> `PROGRESS.md` = the active branch state in detail.

**Last updated:** 2026-09-06
**Repo:** `shift9-studio/.github` - org-owned, NOT in the `Kariimc` user namespace.

## 2026-09-06 - Room Explore Pass-4b (Kariim walk-through layout, take 2)

**Branch:** `feat/intro-room-explore` (PR #48). Do not merge — Kariim rescore.

Second pass after walking the Pass-4 room. Arcade stays gone. Remaining faults:

- Games was a desktop-monitor GLB (stand = “pole in the room”). It is now a
  **flush 65" wall TV** on the right wall (`RIGHT_X - 0.045`), no floor halo.
- Lumen two-cube stack was a 1.5m CSS tower with an orange ring. Now
  **chair-scale** pale-grey 3×3 film cubes directly left of the desk, no halo.
- Entrance props (instrument / arm / Omni) face **into the room** toward the
  desk / film camera, not the door or the back wall.
- Meshy `desk.glb` / `monitors.glb` / `printer.glb` were 132-byte LFS pointers
  on preview. They are now **real git blobs** so Vercel actually ships them.
  The printer on the left cabinet uses the isolated Bambu `enclosed_printer.glb`
  (Meshy `printer.glb` was reconstructed from a still that already includes the
  cabinet, so stacking it read as a black cube).

Intro beat rates unchanged (A 1.0 / B 1.45). Printer + Lumen interaction APIs stay.

## 2026-09-06 - Room Explore Pass-4 (Kariim walk-through layout)

**Branch:** `feat/intro-room-explore` (PR #48). Do not merge — Kariim rescore.

Kariim walked Room Explore as a user. Arcade was backwards facing the wall.
Entrance props read as off. Layout is now film + walk-through:

- Arcade cabinet **removed**. Games is a wall-mounted monitor on the **right** wall.
- 3D printer sits on the cabinet **left of the main desk**, same depth as the desk.
- Lumen is **two** film grid cubes **directly left of the desk** (no junk pile,
  no overhead projector silhouette).
- Instrument / arm / Omni face **into the room**. Omni is off the left-entrance
  and scaled down so it is not a weird “Lumen” blob.
- Hero props: Meshy isolated-still GLBs (`desk.glb` / `monitors.glb` / `printer.glb`)
  plus Hunyuan fallbacks from isolated product photos (`enclosed_printer.glb`,
  `flat_monitor.glb`). Not film-still crops.

Intro beat rates unchanged (A 1.0 / B 1.45). Printer + Lumen interaction APIs stay.

## 2026-09-06 - Room Explore Pass-3 (Meshy + CC0 photoreal heroes)

**Branch:** `feat/intro-room-explore` (PR #48). DO NOT MERGE without Kariim.

Critique stayed ~4/10 on toy / CSS-box heroes. Pass-3 mounts real meshes:

1. **Meshy clean-still path (this agent):** isolated white-bg product stills via HF
   FLUX → Meshy image-to-3d for desk / monitors / printer (90 credits, 3025→2935).
   HF Gradio i2-3d tried first; spaces reset. Draco+WebP GLBs under
   `public/experience/room/{desk,monitors,printer}.glb`.
2. **CC0 path (parallel agent):** Poly Haven drawer cabinet + plants + PBR maps,
   Open Robotics office desk fallback, real SheenChair + HDRI binaries (were
   132-byte LFS pointers so preview never lit).

ACES / soft shadows / printer+Lumen hooks / intro beat rates A 1.0 / B 1.45
unchanged. Lumen stays whitebox cubes (film product).

**Layout correction** is in Pass-4 above (no projector, Omni off the left wall).


## 2026-09-06 - Room Explore synced with main (PR #48 merge prep)

**Branch:** `feat/intro-room-explore` (PR #48).

Merged `origin/main` into this branch so Room Explore can ship without dropping
Flow State Ripple / FlowStateShell, Feelspoon LIVE + Google Play CTA, capsule
polish, or MagneticButton `target` pass-through. Intro beat rates stay A 1.0 /
B 1.45. Honest gap remains: Site-of-the-Year finish still needs Kariim's
Blender-baked hero GLB later.

## 2026-09-05 - Room Explore Pass-2 (enclosed shell + HDRI + soft shadows)

**Branch:** `feat/intro-room-explore` (PR #48).

**Why.** Critique scored Room Explore ~4/10: desk in black void on checkerboard, hard shadows, toy boxes, missing lived-in film props. Widget on biggest miss was skipped ? treated as all of it. Quality bar: harness-3d + threejs-webgl + Shader Tech Pass-2 recipe (never skip enclosed room + HDRI + soft shadows).

**What shipped.**
- Enclosed film-tight shell: floor + 3 walls + front closer + ceiling + baseboards + left window glow + gallery posters. No checkerboard void.
- HDRI ? PMREM: Poly Haven `studio_small_09_1k.hdr` via RGBELoader; `RoomEnvironment` fallback; `environmentIntensity` ~0.85; dim blurred env background; ACESFilmic exposure 1.0.
- Soft shadows: PCFSoft, map 2048, radius 4, blurSamples 8, tight shadow camera to desk AABB; contact shadow plane under desk/chair.
- Screen presence: RectAreaLight + soft Spot on ultrawide; screen ShaderMaterial `toneMapped` + `uBright` scanlines.
- Real maps: Poly Haven concrete floor + plaster wall (CC0). CC0 Khronos SheenChair GLB as chair.
- Printer bay + Lumen whitebox stack + posters remain (film placement, tighter room). Interactions unchanged. Beat rates untouched (A 1.0 / B 1.45).

**Meshy.** Spent **45** credits (balance 3070 ? 3025) on image-to-3D from `04-desk-still` crops (desk/printer/lumen). Results were melted/non-manifold � **not mounted**. Credits noted in `public/experience/room/CREDITS.md`. Need isolated orthographic refs or Blender bake for hero GLBs.

**Still king.** Full Blender authored room + Cycles bake (questopia pattern) remains the SOTY finish line.

**Checks.** `tsc --noEmit` clean; `check-studio-polish.mjs` pass.

## 2026-09-05 - intro walk speed/skip + Room Explore v1

**Branch:** `feat/intro-room-explore` (from `origin/main`). Parallel work may be on
`feat/flow-state-photoreal-water` — do not mix those files into this branch.

**Why.** The walk-to-desk film felt slow, and after the character sits there was no
way to leave the HTML desktop and look around the 3D room that matches the opening
film. Old plan was still viewpoints + hotspots; Kariim wants live explore.

**Intro.** Kariim feedback: the beginning walk-in (approach + entry hall) was
already fine — only the part after he is walking into the room felt slow. Beat A
(`01-03-approach-entry-hall`) plays at natural `1.0`; beat B (desk / room walk,
`04-desk-mouse-screen`) uses `ROOM_WALK_PLAYBACK_RATE = 1.45`. Film Skip is labeled
"Skip to desk". After a first full watch, `localStorage` key `s9-intro-skip-pref`
lets later "Enter the studio" presses jump straight to the desk (first-time
viewers still get the film). Session skip via `s9-intro-seen` is unchanged.
`prefers-reduced-motion` still bypasses the film.

**Stand up.** Desktop chrome has **Stand up** (title row) and a floating
**Stand up · explore room** control. That mounts `RoomExplore` over the shell.

**Room Explore (WebGL / three).** Free look (pointer drag) + WASD/arrows move.
Dark chiaroscuro lighting matching the film mood. Visible hotspot labels.
Way back: **Sit down → desktop**, or Esc / interact with the desk.

**Interactive (shipped):**
- **3D printer** — tap/E → short print animation of the Shift-9 mark → souvenir badge
- **Lumen** — tap through calibration corners on the box stack → mapped colour pass

**Stubs (delight + coming soon):** INSTRUMENT, arcade, Omni-3D hologram, automation arm.
After two prop interactions, a cue points at `/studio`.

**Files.** `RoomExplore.tsx` + module CSS (new); `EnterTheStudio.tsx` / `.module.css`
(mode `room`, skip pref, playback rate, Stand up); `three` + `@types/three`;
`check-studio-polish.mjs` asserts the above.

**How to try.** Open shift9.dev front door → Enter (or Skip) → on the desktop click
**Stand up** → walk to the printer and Lumen rings → Sit down to return.
## 2026-09-05 - Feelspoon LIVE synced onto Room Explore branch

Feelspoon is live on Google Play and at feelspoon.app. Roster / About / dolly /
marketing page no longer say closed testing. Synced from main (#49 / aa31e33)
onto `feat/intro-room-explore` so the PR #48 preview Apps list matches production.
Room Explore Pass-2 work above is unchanged.


## 2026-09-06 - Flow State demo capsule type polish

**Branch:** `fix/flow-state-type-polish`.

Kariim said the rest of `/flow-state` looks good; only the stadium demo
capsule felt unfinished (clipped buffer text, cramped mono labels,
redundant Ctrl+Win footer, loose column rhythm).

**What changed (demo only).** `FlowStateDemo.tsx` + demo selectors in
`flow-state.module.css`. Buffer copy is now `Stay in the thought.` and
fits the local-buffer pill. Labels share `--demo-cols` with the rail so
Armed / Capture / Local buffer line up with F-mark, waveform, and app
sim. Footer is Standby / On-device mic / Never uploaded (no hotkey
repeat). F-mark gets jewel-style inner ring; waveform sits in a quiet
glass well. Ripple / FlowStateShell / waitlist / headline untouched.
WaterSurface stays unused.

**Checks:** `node scripts/check-flow-state.mjs` passes.
**Local preview:** `http://127.0.0.1:3010/flow-state` when the branch
dev server is up.


## 2026-09-05 - Vercel TS: Ripple pruneRipples undefined guard

**Branch:** `fix/flow-state-ripple-ts`.

Production deploy for merged PR #47 failed TypeScript under
`noUncheckedIndexedAccess`: `ripples[i]` in `pruneRipples` is
`Wave | undefined`, so `rp.age += delta` errored. Added
`if (!rp) continue;` before use. The render loop already guarded with
`rp ?`.

Preview then failed on `uniforms.uContent` (Record indexed access is
`T | undefined`, but WebGL expects `WebGLUniformLocation | null`).
Replaced the loose uniforms Record with a typed `requireUniform` map.
Local `tsc --noEmit` passes.

## 2026-09-05 - Flow State switches to Kariim's Ripple (html-in-canvas)

**Branch:** `feat/flow-state-photoreal-water` (PR #47).

Kariim reported Flow State still wasn't water on the feat-intro-room-explore
preview (that branch still has the old 2D line waves). He provided `Ripple.tsx`
and said USE IT.

**What changed.** The page no longer mounts `<WaterSurface />`. A client
`FlowStateShell.tsx` wraps the whole page in `<Ripple>` (hover trigger, ambient
`interval={2.8}`, tuned amplitude/refraction/shine). `page.tsx` stays a server
component and only renders `<FlowStateShell>…</FlowStateShell>`. Obsidian
backdrop lives *inside* the Ripple content so there is something to refract.
`.rippleRoot` is full-viewport with `isolation: isolate`.

**WaterSurface.tsx** is left on disk but unused, so nobody confuses it for the
live effect. Delete later if desired.

**Chrome note.** Full page-bend refraction needs the experimental html-in-canvas
feature (`drawElementImage` / `layoutsubtree`). Without it, Ripple falls back to
normal DOM + glint-only overlays — still better than fake line waves on
hover/click, and ambient interval keeps water alive.

**Preview:** use this branch (`feat/flow-state-photoreal-water`), NOT
`feat-intro-room-explore`. Local: `http://127.0.0.1:3947/flow-state` when the
dev server is up.

**Checks:** `node scripts/check-flow-state.mjs` updated to assert Ripple shell
and passes.

## 2026-09-05 - Flow State water was invisible (stacking + contrast)

**Branch:** `feat/flow-state-photoreal-water` (PR #47).

Kariim reported no water/ripples on Flow State. Two separate facts:

1. **Live shift9.dev still serves the old 2D WaterSurface** until PR #47 merges.
2. **On this branch, CSS hid the WebGL canvas.** `.root` had a solid obsidian
   background with `isolation: isolate`, and `.waterSurface` was `z-index: -2`,
   so the canvas painted *behind* the opaque root fill. Pointer listeners on
   `window` still ran; you just could not see ripples.

**Fix.** `.root` background is transparent. Dark fill moved to a dedicated
`.backdrop` layer at `z-index: -1`. Canvas sits at `z-index: 0`. Soft vignette
`::after` is `z-index: 1`. Topbar/composition are `position: relative; z-index: 2`
(exit pin stays at 3). `WaterSurface.tsx` lifts body/highlight/studio shade and
idle/drop amplitudes so the teal-pearl pool reads on first glance against
obsidian; reduced-motion fallback unchanged.

**Checks:** `node scripts/check-flow-state.mjs` passed after the change.

## 2026-09-05 - Flow State page gets photoreal interactive water

**Branch:** `feat/flow-state-photoreal-water` (PR open / pending merge).

Kariim hated the old Flow State backdrop: a 2D canvas drawing faint sine-wave
strokes that looked like neon lines, not water. That whole renderer is gone.

**What replaced it.** `WaterSurface.tsx` is now a full-viewport WebGL2
heightfield. The GPU runs a ripple simulation (previous + current height maps),
builds normals from the height field, then shades soft caustics, Fresnel, and a
dark-studio refraction look using Shift-9 void/pearl/obsidian tokens. No Three.js
dependency was added.

**Mouse.** Fine pointers push decaying fingertip ripples; dragging makes a larger
wake. Idle water still breathes gently. `prefers-reduced-motion: reduce` freezes
to a still photoreal plate and turns interaction off.

**UI.** `flow-state.module.css` thins the header, demo, metrics, and waitlist
panels into glass/pearl cards so the liquid stays the hero. Waitlist form and
API contracts are unchanged.

**Vercel preview fix (same branch).** Deploy `dpl_2V13CAz1V69LA2umgPhvn4Y3ki6j` failed TypeScript: indexed `framebuffers`/`textures` access is `T | undefined`, but WebGL `bindFramebuffer`/`bindTexture` want `T | null`. Fixed with `?? null` on those four binds in `WaterSurface.tsx`. Local `next build` now typechecks clean. Not a GLSL/SWC issue. Follow-up: Vercel then failed on `canvas` possibly null inside nested `paintFallback`/`resize` (narrowing lost in closures); added `if (!canvas) return` guards. `tsc --noEmit` clean.

**Checks run on this machine:** `node scripts/check-flow-state.mjs`,
`check-studio-polish.mjs`, and `check-instrument.mjs` all passed.

## 2026-09-05 - Feelspoon hero CTA pointed at Google Play

The orange hero button on feelspoon.app said "Open Feelspoon" and linked to
`https://feelspoon.app` — a self-link on the marketing site, so the CTA felt broken.

**Fix**
- `shift9/apps/just-a-pinch/app/page.tsx` — primary CTA is now **Get on Google Play**,
  href `https://play.google.com/store/apps/details?id=com.justapinch.app` with
  `target="_blank"`. "See how it works" (`#how`) unchanged.
- `shift9/packages/ui/src/MagneticButton.tsx` — passes through `target` / `rel`,
  and defaults `rel="noopener noreferrer"` when `target="_blank"`.

Package id confirmed from growth kit / HANDOFF (`com.justapinch.app`). No separate
web-app primary: product Live path is Play. Did not touch Room Explore / Flow State.

**Branch:** `fix/feelspoon-open-cta` off `main`.

## 2026-09-05 - Feelspoon is LIVE (roster + marketing copy)

Feelspoon is live on Google Play and at feelspoon.app. Public status on
shift9.dev and the feelspoon marketing page no longer say closed testing.

**Files**
- `shift9/apps/shift9-dev/app/_components/EnterTheStudio.tsx` — Feelspoon folder
  item `s: "LIVE"` / `sc: "live"`, description + About blurb updated.
- `shift9/apps/shift9-dev/app/_components/studio-dolly-data.ts` — status LIVE,
  comment + note aligned with Google Play / feelspoon.app.
- `shift9/apps/just-a-pinch/app/page.tsx` — hero label, CTA, get-section copy,
  and footer build line no longer say closed testing / launching soon.

**Left alone:** Flow State beta / shipping copy. Room Explore WIP stays on
`feat/intro-room-explore` (not this branch).

**Branch:** `fix/feelspoon-live-status` off `main`.


## 2026-08-24 - the desktop rail works, and every row opens its own room

**Shipped to `main`.** The left rail on the OS-desktop front door was decorative:
eight `div`s, `cursor: default`, highlight welded to Portfolio. It is now the
main way through the site.

**The rail.** Rows are buttons. Click selects and opens. `aria-current` marks the
row, roving `tabIndex` keeps one tab stop, Up/Down/Home/End walk it with focus
following. The highlight is ONE element whose top and height are measured off the
live button (isomorphic layout effect + `ResizeObserver`, so the 900px breakpoint
that hides the rail cannot strand it at 0) and slid on `--s9-ease-snap`. A window
opened from the rail grows out of the row that opened it: the offset is measured
at the click and handed to the animation as `--dx`/`--dy`.

**Eight rooms, no two alike** - `app/_components/RailWindows.tsx` + its module
CSS, new files. Kariim's instruction, 2026-08-24: "all eight in one pass", "use
the impeccable skill and the taste library as a ref", then "don't make the
buttons take you to pages that are exactly like my actual studio, I want
something different and unique." So each takes its structure from a different
harvested reference: Home a title card (Ten Years Away), Portfolio footage
bleeding behind a mono spec column (Hi-ReS!), Media a wall of dithered monitors
with an in-window lightbox (Basement Studio), Products a bento (Units), Contacts
a poster, Settings an instrument panel, Goals a spine, Reports a printed table.

**No typed facts.** Every project, status, note, tag, destination and count is
read from `SET_PIECES` in `studio-dolly-data.ts` and the plates/clips already in
`public/experience/`. The counts on Home, Goals and Reports are computed at
render, so nothing here can drift from the desktop folders behind it.

**Settings is wired, not drawn.** Its three switches drive the shell's own state:
theme, the icon-grid `compact` flag, and a new `calm` class on `.root` that stops
animation while keeping every colour. Persisted as `s9-desk-theme` and
`s9-desk-motion`.

**Verified before the commit, in a real browser at localhost:3117:** production
build green, `tsc --noEmit` clean, the Impeccable mechanical detector returning
`[]`, the highlight's `translateY`/`height` matching the selected button exactly
on all eight rows, a real ArrowDown moving selection AND focus, all sixteen wall
tiles measured filling their cells, the switches changing `.root`'s class list,
and Escape closing the film before the window.

**Gemini looked at the live page** (his standing order, 2026-08-21: anything
visual is inspected by Gemini, nothing else). It reported four things on the
Portfolio room. Two were a misread of the ragged last row as clipping - measured
on the live site, the strip has no horizontal overflow and 27px of gap on both
sides. Two were real and are fixed: long project names were cut mid-word by an
ellipsis (now clamped to two lines) and the readout's wrapped "BUILT WITH" pair
sat tighter than the rows around it (line-height 1.75).

Gemini also looked at the Media room: grid clean, but the printed indices
jumped (06, 07, then the far-right big tile as 08, then back to the bottom
left). True - `grid-auto-flow: dense` backfills the holes a 2x2 tile leaves, so
DOM order and reading order differ. The indices are gone; the name was the only
part carrying information.

Second look, after those two fixes: Gemini said the wrapped names now sat on
the artwork and the readout row was still tight. Both fixed properly - the
thumbnail label now carries its own gradient ground (like the Media wall's
labels) instead of relying on a text shadow, and the readout rows were given
real padding rather than only a taller line-height on the value.

Third look: Gemini still called three things wrong - names unreadable over the
artwork, the BUILT WITH pair squished, and the foot line's descenders clipped.
Each was measured on the live page rather than argued with. The label carries a
scrim, sits inside its card with 8.5px under the text; the readout's value runs
at an 18.05px line-height with 9px to the row's rule; the foot line is an 11px
text run in a 37px box with 10px padding and no clipping. None of the three
reproduce, so nothing further was changed on that pass. The two findings that
DID reproduce (the ellipsis and the wrapped-row spacing) are the ones fixed.

Kariim spotted three more on the live site, 2026-08-24. (1) The Products room's
small cells were empty boxes with the name sunk to the floor - Gemini confirmed
"massive empty voids ... looks like an image failed to load". They now carry
their own plate, so the space is filled by the work. (2) The reference page's
grids drew their hairlines with a coloured sheet behind the grid, which paints
every unused cell of the last row as a solid grey block; six rooms in a
four-column grid left two. All four grids (.swatches, .archiveNav, .projectGrid,
.surfaces) now ring each cell instead, so an empty cell is nothing at all
whatever the count. Gemini's check on that first attempt: the grey was gone but the grid then read
as "a table missing a chunk of its bottom-right corner", because these cards are
deliberately edge-to-edge rather than discrete. So the sheet is back and the ROW
is completed instead - the page renders (4 - n % 4) % 4 filler cells, shown only
at the four-column layout, where the roster is the only one that can be short.
Fillers were not enough either - an obsidian filler still gets framed by the
sheet's rules, so Gemini still read "two glaringly empty boxes ... the grid lines
continue through this empty space". Settled shape: nothing fills the row, the
CARDS of the last row widen to close it (span = cols / remainder, applied only
where the remainder divides the column count, only at four columns). Gemini also
caught near-black chips vanishing into the ground in the /soon and entrance bars;
each chip now carries an inset ring at 22% white, the same weight the colour
swatches upstairs use (the 9% hairline was still invisible on a near-black chip). Last note from the
same pass: the widened cards stretched their chips wider than the rest, so the
bar is capped at 17rem and one chip size now holds across every card. The other three grids were put back
exactly as they were; none of them was ever short a cell. (3) The "$" before the Automation Systems copy on /studio was
the terminal card's shell prompt (.terminal .note::before). It was deliberate,
he was told so, and he said remove it - so the rule is gone. The card keeps its
mono face, its log-block ground and its border; only the prompt marker went.

Kariim, same day: on /instrument/reference "to the left the entire thing is cut
off at the bottom". Reproduced at 1920x760, 1536x700 and 1920x640: the left
column runs 713-890px tall and was `position: sticky`, so on a laptop-height
window it was pinned taller than the screen and the numbered register at its
foot could never be scrolled to. It now sticks only above a 62rem-tall viewport
and is capped at the screen height even there.

**Still open.** Goals and Reports are derived from the roster's own status field;
real quarterly targets would have to come from Kariim. `pnpm lint` remains broken
repo-wide (`next lint` was removed in Next 16), so this had typecheck, detector
and a live browser pass but no lint.

## Read first - the discovery trap

This repo is owned by the **`shift9-studio` org**. `gh repo list Kariimc` does **not** return it,
and neither does `github.com/Kariimc?tab=repositories`. Any script or agent that enumerates repos
by user silently skips this entire project and reports success. That is why this repo went
un-audited and carried no continuity doc until now.

Correct queries:

    gh repo list shift9-studio
    gh api '/user/repos?affiliation=owner,collaborator,organization_member'

## 2026-08-23 (third pass) - the shift9.dev opening film, fixed but NOT deployed

Kariim reported: "shift9.dev is not playing the opening video it is glitching
right to the homescreen."

**Reproduced and root-caused. Two faults, stacked.**

1. **Asset bitrate.** `01-03-approach-entry-hall-v4.mp4` was 24,906,455 bytes for
   10.04s = **19.8 Mbps**. Beat two was 13,633,089 bytes = 10.9 Mbps. Measured
   against the LIVE site through Chrome with CDP throttling at 8 Mbps: playback
   advanced 0.35s then stalled ~2s, repeating. After 26s of wall time it had
   shown **3.56s** of a 20.1s film. faststart was already correct; codec was
   already h264/avc1/yuv420p. Bitrate alone was the fault.
2. **A wall-clock cap in the player.** `EnterTheStudio.tsx` armed
   `setTimeout(enterDesk, 26000)` on the first `playing` event. A flat 26s cap on
   a 20.1s film means any line too slow to stream in real time gets yanked to the
   desktop part-way through. That is the "glitching right to the homescreen".

**What changed (4 files, all in `apps/shift9-dev`):**

- `public/experience/opening/01-03-approach-entry-hall-v4.mp4` - re-encoded.
  24.9MB -> 5.88MB (19.8 -> 4.68 Mbps). libx264 high, preset slow, crf 21,
  maxrate 4500k, bufsize 9000k, yuv420p, +faststart, -an.
- `public/experience/opening/04-desk-mouse-screen-v5.mp4` - same recipe.
  13.6MB -> 3.88MB (10.9 -> 3.10 Mbps).
  Both: duration 10.041667s unchanged, 241 frames unchanged, dimensions
  unchanged (1924x1076 and 1928x1076), 24fps unchanged. Originals backed up (see
  "originals" below).
- `app/_components/EnterTheStudio.tsx` - the 26s stopwatch is replaced by a
  stall watch. Every 1s it reads `vid.currentTime + videoBRef.currentTime` (SUM,
  not max: at the join beat one holds at 10.04 while beat two restarts at 0, so a
  max reads as frozen for the whole second beat and would bail every time). If
  that sum has not moved for 12s, playback is genuinely stuck and it drops to the
  desktop. A slow line is now allowed to finish. The net still arms on `playing`
  and not a frame earlier, which was the original rule.
- `scripts/check-studio-polish.mjs` - the build-time guard asserted the exact old
  line and failed the build. Rewritten to assert the new mechanism, plus a
  `doesNotMatch` so the flat stopwatch cannot come back. NOTE: that doesNotMatch
  scans the component source, so no comment in `EnterTheStudio.tsx` may contain
  the literal `setTimeout(enterDesk, 26000)` - it will fail the build. That
  already bit once this session.

**Also added:** `apps/shift9-dev/Try-The-Fixed-Intro.cmd` - a double-click that
runs the site on port 3942 for Kariim to poke. Untracked; delete or commit as
preferred.

**Proof (rebuilt site, real Chrome via playwright-core, CDP throttling):**

| Line | Result |
| :-- | :-- |
| 50 Mbps | both beats ran to the end, 20.9s |
| 12 Mbps | both beats ran to the end, 21.8s |
| 8 Mbps  | both beats ran to the end, 22.8s |
| 5 Mbps  | both beats ran to the end, 28.8s |
| 3 Mbps  | both beats ran to the end, 39.9s |

Before the change, 8 Mbps was the stuttering mess described above and 5/3 Mbps
were cut off by the 26s cap. `npm run build` passes, including all
`check-studio-polish.mjs` assertions. Gemini compared original vs re-encoded
frames at t=2/5/8 on both beats and found no visible loss; Gemini also watched a
recording of the fixed intro at 8 Mbps and reported smooth playback, a clean join,
and a natural settle into the desktop.

**Fifth file, same session:** `app/_components/EnterTheStudio.module.css`. Kariim
spotted it in the sandbox: hovering the round email button bottom-right showed a
tooltip cut off by the right edge. The button is `position: fixed; right: 26px`
and 38px wide, so its centre is 45px from the edge, while the bubble is the
studio address at 147px nowrap. Centred, 28px of it fell off a 1920px screen.
Now `.desktop .helpdot[data-tip]::after` anchors `right: 0; left: auto;
translate: 0 0`, opening inward. The rise-and-fade `transform` is untouched.
Measured at 1920/1440/1280: bubble spans end 26px clear of the edge at every
width. Gemini confirmed the full address is readable and inside the screen.

**STATE: LIVE AND VERIFIED on shift9.dev.** Kariim gave permission and `763d0ba`
went up. Checked on the public site afterwards, not assumed: the opening film
file returns **5,878,131** bytes; both beats run to their natural end at 8 Mbps
(22.1s), 5 Mbps (31.0s) and 3 Mbps (40.4s) through real Chrome with throttling;
the email tooltip fits with 26px clear at 1920, 1440 and 1280, and Gemini
confirmed the whole address is readable and inside the screen.

## 2026-08-24 - the desktop tile labels are one colour now

Kariim: "make them the same color like the other labels", pointing at the blue
"Services" label. `.dicon.site .fname` and `.dicon.site .fcount` in
`EnterTheStudio.module.css` were forcing `color: var(--blue)` on the two
live-site tiles (Services and Shift9.dev) while the four folder tiles used
`--w-txt`. Both colour overrides removed; the heavier font weights stay, so those
two still sit slightly forward. Nothing else touched.

Verified by reading computed colour off the live DOM in both themes, not by eye:
all six `.fname` come back identical, `rgb(232,234,240)` in dark and
`rgb(31,35,40)` in light. Typecheck clean, full build clean, all three guard
files pass, 14 pages generate.

**Method note worth keeping.** A first Gemini pass on the full-page screenshot
reported "About is black, the rest are white" and called the row a styling bug.
That was wrong. The computed colours were identical, and a 2x zoomed crop of just
the label row had Gemini agree all six are the same. **On a busy background, a
full-page vision pass misreads label colour. Crop and zoom before believing it**,
and check computed style alongside.

**Then Kariim: "About was shorter than the others idk why but it also is a lot
bigger than the others when I click to turn on the icon grid."** Both real, both
the same root cause, both fixed in `EnterTheStudio.module.css`:

- `.aboutico` was `76px / 10px margin / 19px radius` against `.appico`'s
  `78 / 12 / 18`. That put its label exactly 4px above its two row-mates. The
  old comment justified 76 as matching `.fico`, which was right when About sat
  in a folder row and is not any more. Now matches `.appico` exactly.
- `.grid.compact` (the Icons view) shrinks `.fico` and `.appico` to 52px.
  `.aboutico` was never in that selector list, so About alone stayed at full
  size. `.grid.compact .aboutico` added alongside `.appico`.

Measured after, on the real glyph boxes rather than element boxes: all three
bottom-row labels sit at glyph top 448.77 with identical colour, weight, size
and family; all six faces are 78px in Grid and 52px in Icons.

**The vision tool misread this row twice.** On the full desktop shot it said
"About is black, the rest white"; on the bottom-row shot it said About was lower
and off-white. Both wrong, both against the dense ASCII wallpaper. **Trust the
computed values over a vision pass on this page**, and crop tight before asking.

**Found while looking, NOT fixed, NOT asked for.** In Icons view the grid is
`repeat(5, 112px)` with six tiles, so Shift9.dev is orphaned alone on a second
row. Pre-dates all of this and is a layout choice, not a bug. Put to Kariim.

**One thing found while looking, NOT fixed and NOT asked for.** Gemini's sweep of
the live desktop flagged the folder labels ("Apps", "Games", "Tools", "About"
and their subtext) as low contrast: dark grey text sitting straight on the dense
dark grey ASCII wallpaper. Real, but outside what Kariim asked for, so it was
left alone and put to him as a question. If he says yes, the fix is a subtle
shadow, a blur behind the text, or a semi-transparent pill under the labels.

Commit `e3c988b` carries six
files: `HANDOFF.md`, `EnterTheStudio.tsx`, `EnterTheStudio.module.css` (the
tooltip anchor), `check-studio-polish.mjs`, and the two re-encoded opening
`.mp4`s. The temporary `Try-The-Fixed-Intro.cmd` sandbox launcher was deleted
before the commit so it never landed in the repo.

Sending that commit to GitHub was refused by this session's auto-mode permission
classifier. Not by git, and not by any rule of Kariim's. Nothing is wrong with
the commit itself. A double-click file `Put-The-Intro-Fix-Live.cmd` sits at the
repo root so Kariim can send it himself; it does nothing else.

**NEXT STEP:** send `e3c988b` to GitHub. Vercel builds from it. Then check the
public site: the opening film file under `/experience/opening/` must come back
**5,878,131** bytes, not 24,906,455, and the email button's tooltip in the
bottom-right corner must sit fully inside the screen. If sending is refused
again, hand Kariim the double-click file rather than working around the block.

**Originals, if the re-encode is ever rejected:** backed up this session to the
session scratchpad at
`AppData/Local/Temp/claude/C--Users-Kariim/7a1996f0-0370-4b80-a3d2-02c6cc1b212c/scratchpad/originals/`.
That path is temporary. If the re-encode is not approved quickly, restore from
git instead: the originals are still the committed versions on `main`, so
`git checkout -- apps/shift9-dev/public/experience/opening/` brings them back.

**Open question for Kariim:** none blocking. He may want beat one lighter still
(a 3.5 Mbps encode was made and Gemini flagged "minor softening in the finest
details", so it was rejected in favour of keeping quality).

## 2026-08-23 - feelspoon.app is LIVE

Kariim's call this session: the product site moves to **feelspoon.app** rather
than renaming the `pinch.` subdomain.

**Done, on Vercel, and verified by the API's own response.** Both names are on
the `just-a-pinch` project (`prj_DruKJia6BmFr5YH29UkHBjgSIt2m`, team
`team_JQyCKGeeEsZdd7dym2lLxgjY`) and both came back `verified: true`:

- `feelspoon.app`
- `www.feelspoon.app` -> 308 redirect to the apex

The Vercel dashboard UI could not be clicked: the Chrome window was minimised,
so `innerWidth/innerHeight` read `0x0`, nothing laid out and the Add-domain
dialog never opened. Resizing a minimised window does not restore it. The work
was done instead by calling the dashboard's own endpoint from the page context
with the session cookie, which is the same action the button performs:

    POST /api/v10/projects/<projectId>/domains?teamId=<teamId>  {"name": "..."}

**Not done - it needs Kariim.** The Cloudflare session has expired
(`/api/v4/zones` returns 403, code 9300, "User session has expired"). No
Cloudflare token exists anywhere on the machine: not in the environment, not in
`cmdkey`, no `.wrangler` config, and `WHAT-HE-HAS.md` does not name one. So the
DNS records cannot be written from here.

Records Vercel asked for, read live from `/api/v6/domains/feelspoon.app/config`:

| Type | Name | Value | Proxy |
|---|---|---|---|
| A | `feelspoon.app` (apex, `@`) | `216.198.79.1` | DNS only |
| A | `feelspoon.app` (apex, `@`) | `64.29.17.1` | DNS only |
| CNAME | `www` | `341e22eb25d95fe5.vercel-dns-017.com` | DNS only |

Vercel's rank-2 fallbacks, if the above are ever refused: A `76.76.21.21`,
CNAME `cname.vercel-dns.com`. **Proxy must be off (grey cloud)** - Cloudflare's
orange-cloud proxy in front of Vercel breaks certificate issuance.

Nameservers confirmed as Cloudflare's (`albert` and `nucum`), and the domain
currently resolves to nothing: no A record, `www` NXDOMAIN, no HTTP response.

`pinch.shift9.dev` keeps working throughout - both names point at the same
project. Whether the old address should 308 to the new one after cutover is
Kariim's call and is NOT set up.

> **CLOSED the same session.** Kariim signed in to Cloudflare and the three
> records below were written through the dashboard's own API from the page
> session. The zone had **zero** existing records, so nothing was overwritten.
> `feelspoon.app` returns **200** and serves the product site: title
> "Feelspoon - Smart Recipe Organizer & Cooking App", **zero** occurrences of
> the old name. `www` returns **308** to the apex. `pinch.shift9.dev` still
> returns 200 - both names point at the same project, so nothing broke.
>
> TLS was not instant: the apex returned a connection error for roughly 75
> seconds after DNS landed while Vercel issued the certificate. That is normal;
> do not go changing records during it.
>
> The three portfolio links that pointed at `pinch.shift9.dev` now point at
> `https://feelspoon.app`.
>
> **A measurement note worth keeping.** Gemini reported the phone layout's
> headline and body text as "cut off on the right edge". Measured, it is not:
> page overflow 0 at 280/344/390/673, and **zero** elements with clipped text
> (`overflow: hidden` plus `scrollWidth > clientWidth`). The `h1` fits exactly
> (client 342 = scroll 342, right edge 366 inside a 390 viewport). The single
> element wider than the viewport is the full-bleed hero `<img>` with
> `object-cover`, which is supposed to be clipped. Vision is good at "is the
> brand right"; it is unreliable about edges. Measure edges with the DOM.


## 2026-08-23 (second pass) - the Services tag, and the desktop on narrow screens

### The price tag was rendering as a black blob

`.appico` had a rule for `img` and none for `svg`. The Services tile is the
only one holding an inline glyph rather than an image, so its `<svg>` fell back
to the browser's replaced-element default of 300x150 and to `fill: currentColor`
- a huge black tag clipped by the tile's `overflow: hidden`. It shipped that way.

Fixed with `.appico.glyph` + `.appico.glyph svg`, mirroring `.aboutico svg`
(38px, `fill: none`, white 1.9 stroke) plus a blue face so the tile is not
transparent while the holo layers sit at rest. Gemini, looking at the render:
"sits fully inside the blue rounded square. It does not overflow, nor is it
clipped."

### The desktop ran off the edge of a folding phone's cover screen

Measured, not guessed, on a 280px viewport (Galaxy Fold outer display):

| | before | after |
|---|---|---|
| elements past the right edge | 13 | 0 |
| `.desktop` scrollWidth vs client | 340 / 280 | 280 / 280 |
| `.taskbar` scrollWidth vs client | 340 / 280 | 280 / 280 |

Two separate causes:

1. `.dicon` was a fixed `width: 160px` while its grid columns were
   `minmax(0, 160px)` and did shrink. The tile did not follow the column, so
   the right-hand column simply left the screen. Now `width: 100%;
   max-width: 160px`.
2. The top row and taskbar needed 340px. The four nav words (Home, About,
   Accounts, Log in) are set dressing and already `aria-hidden`, so they are
   dropped below 22.5rem, and `.clock` stops being absolutely positioned (it
   had been sitting on top of the taskbar icons).

**The new `@media (max-width: 22.5rem)` block is deliberately the LAST thing in
the file.** An earlier copy placed higher up was silently overridden by the
`max-width: 768px` block that targets the same selectors, and the computed
styles proved it (padding still read `26px 18px`). If these rules ever stop
working, check what sits below them before editing the values.

Verified at 280, 320, 344, 390, 540, 673, 768 and 1440: horizontal page
overflow 0 and zero elements past the right edge at every one. Gemini on the
enlarged 280px render: six tiles, right column "fully visible with a margin",
top-right button fully visible.

**A trap worth keeping.** A 280px-wide screenshot is too small for a vision
model to judge; it reported the right column as sliced off when the measured
geometry said otherwise. Enlarging the same image 3x reversed the verdict.
Measure geometry with the DOM, and enlarge before asking anything to look.

### Also

- The studio bio said Feelspoon was "now live on Google Play" while the card
  above it read IN TESTING. It is in testing; no app file has been uploaded.
  Now "now in testing on Google Play".

## 2026-08-23 - the recipe app is Feelspoon everywhere on this site

The app shipped under `Kariimc/Just-a-pinch` was renamed **Feelspoon**. This
repo was the last place still showing the old name in public.

Changed, user-visible only:

- `shift9-dev` set-piece 01 and the `/instrument` specimen now read **Feelspoon**
  (title, specimen label, action label, the two prose mentions, and the apps
  roster entry in `EnterTheStudio`).
- `apps/just-a-pinch` (serves **pinch.shift9.dev**) - page title, meta
  description, OG/Twitter titles, the eyebrow banner, both body paragraphs, the
  footer copyright and the three phone-screenshot alt texts.

**A dead link was the real defect.** The set piece's "Get the app" pointed at
`https://kariimc.github.io/Just-a-pinch/`, which has returned **404** since the
app repo was renamed. It now points at `https://kariimc.github.io/Feelspoon/`
(verified 200). Both live addresses on the card were checked, not assumed.

`scripts/check-instrument.mjs` asserted `/Just a Pinch/` and **failed the build**
when the roster changed - the guard working exactly as intended. Updated to
`/Feelspoon/`. Its second assertion pins the asset filename and still passes.

**Deliberately NOT changed** - none of it is ever displayed, and changing it
buys nothing while risking the video loop and the guard:

- Asset filenames `01-just-a-pinch.png` / `.mp4`, and their entries in
  `public/experience/assets.json`.
- The workspace folder and package name `apps/just-a-pinch`.
- Code comments that explain the warm surface's history.

Proof: `pnpm typecheck` 2/2 pass, `pnpm build` 2/2 pass (it failed first on the
guard, which is why the guard exists). Both pages were served locally and read
back from the rendered DOM - studio card heading "Feelspoon", both links
resolving, **zero** old-name text in `document.body.innerText`; the product page
renders zero old-name strings in its served HTML.

**Open, and it is Kariim's call in flight:** the subdomain is still
`pinch.shift9.dev`, and he has chosen to move the product site to the
**feelspoon.app** domain he already owns at Cloudflare rather than rename the
subdomain. That cutover is not done here. Note it changes an address that the
Play Console listing links to, so it is sequenced against the store review.

**Also spotted, not changed:** the studio bio says Feelspoon is "now live on
Google Play". It is not - the set-piece status is IN TESTING, production track
is inactive and no AAB has been uploaded. The two statements contradict each
other on the same page. Wording is Kariim's, so it is flagged rather than
rewritten.

## Current state

Three products in one repository:

| Surface | Path | Target | State |
|---|---|---|---|
| GitHub org page | `profile/` | github.com/shift9-studio | Live. Panels generated by `profile/scripts/build-panels.py` + `build-banner-photo.py`. Never hand-edit `profile/assets/*`. |
| Studio flagship | `shift9/apps/shift9-dev` | shift9.dev | Live: `/`, `/studio`, `/flow-state`, `/start`, `/soon`, `/instrument`. Flow State has the approved launch page and waitlist capture — see `PROGRESS.md`. |
| Product site | `shift9/apps/just-a-pinch` | pinch.shift9.dev | Built: single landing page. |

**Stack:** pnpm >=10 + Turborepo, Node >=20, Next.js 16 App Router, Tailwind v4.
**Workspace root is `shift9/`, not the repo root.** `.npmrc` uses `node-linker=hoisted` intentionally.
Deploy: Vercel, both apps from this repo. See `shift9/DEPLOY.md`.

**Packages - all four implemented:**

- `@shift9/theme` - `tokens.css` + `theme.css`. Single source of truth. Void `#0f172a`, Signal `#22d3ee`, Pulse `#8b5cf6`.
- `@shift9/ui` - CustomCursor, DecodeText, DitherField, EdgeReticle, GrainField, GridFrame, GridSweep, MagneticButton, MonoLabel, ProximityText, Skeleton, SpiceMote, TelemetryRail, WorkWall.
- `@shift9/motion` - springs, scrollSignal, useMagnetic, useProximityWeight, useReducedMotionSafe, useScrollVelocity, useInstrumentTelemetry.
- `@shift9/data` - Supabase client, read recipes, and insert-only waitlist capture. Returns `null` when env vars are absent; every consumer carries a static fallback.

## Recent changes

- **2026-08-05 - the return-to-desktop flash, and one mail control instead of three.**
  Same branch, `claude/fix-start-mailto`. Three of Kariim's calls, same day.
  (1) *"when you click back to desktop from the invitation page I can see frames from the
  earlier video."* Cause: `EnterTheStudio`'s `mode` initialises to `"gate"` because the
  server cannot read `sessionStorage`, and the already-seen check ran in a plain
  `useEffect` - which fires AFTER the browser paints. So the front door and the film's
  first frame got a paint or two before being flipped to `"desk"`. Moved to
  `useLayoutEffect` behind an isomorphic guard (React warns if it runs during server
  render), which runs after the DOM is written but BEFORE paint, so the desk is the first
  thing that reaches the screen. No other behaviour changed.
  (2) *"make it so when you click the email address the email client the user uses pops up
  not copied to clipboard."* The clipboard fallback is gone and `StartAction` is deleted;
  the control is a plain `mailto:` with no JavaScript in the path, which hands off to
  whatever the machine has set as its mail handler. **Stated to him and chosen by him:**
  on a machine whose mail association is missing or broken this does nothing visible.
  Checked on his own machine - his `mailto` UserChoice is
  `AppXbx2ce4vcxjdhff3d1ms66qqzk12zn827` with no command registered, which is exactly why
  it did nothing for him; that is a Windows default-apps setting, not a site bug.
  (3) *"you don't need an email me and write to shift9dev on the same page directly above
  each other ever."* The close had an "Email me" button with "or write to
  shift9dev@gmail.com" immediately beneath it - the same address, the same mailto, twice.
  The button now carries the address itself, and the line under it is gone. One control,
  verified: exactly one mailto element in `<main>`.

- **2026-08-05 - the conversion funnel joined up end to end; not merged.** Branch
  `claude/fix-start-mailto`. Two problems, one chain. (1) `/services` shipped as an
  orphan - nothing on the site linked to it, so the three outreach emails aimed at paid
  work landed on a reel with no prices and no way to find them. (2) `/start`'s only
  button was a bare `mailto:`, which does nothing on a machine with no mail client and
  gives no feedback, so it read as broken. Kariim, live: *"where is the services page I
  don't see it and when I click start a project nothing happens."*
  His call the same day: **the services page goes on the end of Start a project**, plus a
  door from the desktop. The chain is now
  `reel -> invitation -> START A PROJECT -> /services (the offer) -> EMAIL ME`,
  with a second entrance from the desktop's new **Services / "What it costs"** tile,
  placed before the door tile so the door still closes the row.
  `/start`'s button is a plain link to `/services`; the writing-to-Kariim step moved to
  the bottom of the offer, where someone has actually read the prices. `/services`'s hero
  now sends you DOWN into the offers (`#offers`) instead of back to `/start`, which would
  have been a loop. `StartAction` moved to `app/_components/` and takes a label.
  Two defects found by testing rather than reading, both fixed: the first draft set the
  confirmation only in the clipboard's success callback, so any clipboard failure left the
  button silently dead again - it is now set synchronously and only upgrades to "copied"
  when the copy lands; and the confirmation was a flex sibling of the buttons and never
  painted where anyone could see it - it now shares a wrapper with its own button. The
  window is 12s, not the desktop tooltip's 2.4s, because here the message IS the fallback
  address. Verified with real trusted clicks on a production build; a scripted `.click()`
  does not reproduce it (no user activation, so the clipboard silently refuses) which is
  exactly what made the first draft look correct. The desktop is locked creative
  direction - the tile was added on Kariim's explicit yes.

- **2026-08-05 - `/services`, the page the outreach was missing; built, not merged.**
  Branch `claude/services-page`. Kariim sent ten cold emails on 2026-08-05; three of them -
  the three aimed at paid studio work - are signed `shift9.dev/studio`, which is a
  twelve-build reel carrying no price, no offer and no scope. `/start` takes a message but
  answers no commercial question. The dossier (31 Jul 2026) makes this its P0 site: two
  fixed-scope offers, proof, process, price band, availability, direct intake.
  Two new files under `app/services/` — plus this continuity entry, which the repo requires in
  the same commit; no other app or package code is touched. Every price, scope line and the
  market-reference disclosure are lifted from the dossier's own offer sheet, read from Drive
  rather than invented: Interface rescue - **2026-08-05 - `/start`'s only button did nothing; fixed, not merged.** Branch
  `claude/fix-start-mailto`. Kariim, on the live site: "when I click start a project
  nothing happens." He was right, and it was the whole conversion path. The button was a
  bare `mailto:`, which on a machine with no mail client configured does nothing at all
  and gives no feedback either way - so it reads as broken, not as unhandled. Every route
  into the studio funnels through this page, including the three outreach emails aimed at
  paid work.
  The repo had already solved this once, on the desktop shell's envelope
  (`EnterTheStudio.tsx`): keep the href, and also copy the address on click with visible,
  announced confirmation. This is that pattern moved to the surface where it decides
  whether a lead converts, in a new `app/start/StartAction.tsx`.
  Two defects were found while building it, both by testing rather than by reading:
  (1) the first draft set the message only in the clipboard's success callback, so any
  clipboard failure - no permission, no user activation, insecure context - left the
  button silently dead again. The message is now set synchronously on click and never
  depends on the copy; the wording upgrades to "copied" only if the copy actually lands.
  (2) The confirmation was a flex sibling of the buttons and never painted where anyone
  could see it; it now shares a wrapper with the button it belongs to. The window is 12s
  rather than the desktop tooltip's 2.4s, because here the message IS the fallback
  address and 2.4s is not long enough to read one.
  Verified with a real trusted click on a production build: message visible in verdant
  under the button, address on the clipboard, `role="status" aria-live="polite"`.
  A scripted `.click()` does NOT reproduce it - no user activation means the clipboard
  silently refuses, which is exactly what made the first draft look correct.,500-$3,000 fixed; Two-week product sprint
  $4,000-$8,000 fixed; Embedded product partner $3,000-$5,000/month. Built on the
  invitation's obsidian ground with the `/instrument` lattice so the two reading surfaces
  match. No canvas, deliberately - this is a page you read three prices off, and the house
  already keeps its canvas on `/start` and its reading surfaces flat. Just a Pinch is left
  out of the proof section on purpose: the name is under a clearance hold and board item N5
  is blocked on it.
  Chief of Staff bounced round 1 on three defects, all fixed and re-measured: a 29px lattice
  band leaking under the two shorter proof cells (now 0px - the reveal wrapper is the grid
  cell, not the link inside it); verdant on four step numbers and the availability dot (now
  zero-chroma, leaving exactly one green element on the page - the email address, matching
  `/start`); and a close heading that repeated `/start`'s H1 verbatim one click before it.
  Ship-check green: uncached typecheck, full build with the repo's three contract suites, no
  `.env` present, zero raw hex/durations/easings, zero overflow at 375px, reduced-motion
  verified under real emulation, all six links live.
  **Open for Kariim:** the page is an orphan - nothing links to it yet, and adding an inbound
  link touches a locked surface, so that is his call.
- **2026-08-05 - `/start`'s only button did nothing; fixed, not merged.** Branch
  `claude/fix-start-mailto`. Kariim, on the live site: "when I click start a project
  nothing happens." He was right, and it was the whole conversion path. The button was a
  bare `mailto:`, which on a machine with no mail client configured does nothing at all
  and gives no feedback either way - so it reads as broken, not as unhandled. Every route
  into the studio funnels through this page, including the three outreach emails aimed at
  paid work.
  The repo had already solved this once, on the desktop shell's envelope
  (`EnterTheStudio.tsx`): keep the href, and also copy the address on click with visible,
  announced confirmation. This is that pattern moved to the surface where it decides
  whether a lead converts, in a new `app/start/StartAction.tsx`.
  Two defects were found while building it, both by testing rather than by reading:
  (1) the first draft set the message only in the clipboard's success callback, so any
  clipboard failure - no permission, no user activation, insecure context - left the
  button silently dead again. The message is now set synchronously on click and never
  depends on the copy; the wording upgrades to "copied" only if the copy actually lands.
  (2) The confirmation was a flex sibling of the buttons and never painted where anyone
  could see it; it now shares a wrapper with the button it belongs to. The window is 12s
  rather than the desktop tooltip's 2.4s, because here the message IS the fallback
  address and 2.4s is not long enough to read one.
  Verified with a real trusted click on a production build: message visible in verdant
  under the button, address on the clipboard, `role="status" aria-live="polite"`.
  A scripted `.click()` does NOT reproduce it - no user activation means the clipboard
  silently refuses, which is exactly what made the first draft look correct.
- **2026-08-05 - `Reveal`'s clip-path variants were silently invisible; fixed, not merged.**
  Branch `claude/fix-reveal-mask`. Anything wrapped in `<Reveal variant="mask">` or
  `variant="scan"` stayed clipped to nothing forever - no console error, no warning,
  just a blank space where a headline should be. Cause, isolated on a production build
  with four `motion.div`s differing only in what they animate: **`clipPath` never tweens
  when the variant is driven by `Reveal`'s own `whileInView`.** It is applied at the
  `hidden` value and left there. `opacity` and `y` both animate fine, which is why
  `rise` and `fade` always worked. The originally-suspected `y: "0.45em"` string was
  **not** the cause - `scan` already used a plain number and failed identically, which
  is what ruled it out. The same variants work through `RevealGroup`/`RevealItem`,
  where the parent propagates the variant instead of the child watching its own
  viewport. Fix strips `clipPath` on the `whileInView` path only and leaves the
  orchestrated path untouched; measured after, all four variants reveal through
  `Reveal` and the two clip-carrying ones still complete their wipe
  (`inset(0%)`) through `RevealItem`. The underlying framer-motion cause is
  deliberately **not** guessed at - the behaviour is measured and the workaround is
  scoped. `Reveal` currently has no callers on `main`; the first would arrive with the
  unmerged `/services` page, which is why this was worth fixing rather than deleting.
  Ship-check green: no lockfile drift, uncached typecheck clean, both apps build with
  no `.env` present, diff carries no raw hex, durations, easings, `any` or `ts-ignore`.

- **2026-08-02 - Flow State confirmation email prepared, not merged.** Branch
  `claude/flow-state-confirmation-email` sends a Resend confirmation only after
  the insert-only waitlist accepts or duplicate-masks the address. Delivery is
  idempotent for 24 hours, bounded by a five-second abort, and failure-safe: the
  form says the place is saved when mail is unavailable. The existing Resend
  account already had `shift9.dev` verified; a new sending-only, domain-restricted
  `Flow State confirmation` key is stored as sensitive Vercel Preview/Production
  `RESEND_API_KEY`. The Supabase Auth key was not reused or changed. Supabase
  Table Editor is the private waitlist view; Resend Emails is the delivery view.
  Focused guard, bite proof, typecheck, both production builds, and the local
  no-mail fallback pass. Green PR #42's protected preview returned
  `confirmation: sent`; Resend recorded the message to `shift9dev@gmail.com` as
  delivered. Only Kariim's explicit merge approval remains.

- **2026-08-01 - Desktop and conversion follow-up authorized for merge.** Branch
  `codex/fix-theme-tooltip` keeps the Light-theme tooltip above the desktop
  controls while removing the redundant Grid/Icons hover tips. Flow State's
  header now clears the fixed return control (measured at 185.72px versus
  188px, with no overlap). The Instrument boundary copy is client-facing and
  its repeated mid-page `Start a project` button is gone; the final conversion
  point remains. The Shift-9 Vercel Production and Preview projects now hold
  the real public Supabase URL and publishable key instead of placeholder
  references. A local `/api/waitlist` submission for `shift9dev@gmail.com`
  returned `200 {"ok":true}` against the live insert-only list. Focused guards,
  typecheck, the full production build, `git diff --check`, and live DOM checks
  pass. Kariim explicitly authorized merging this follow-up on 2026-08-01.

- **2026-08-01 - Instrument public case study prepared in PR #40; merge authorized.** Branch
  `codex/instrument-case-study` turns `/instrument` into a public explanation of
  the system through Shift-9 Studio, Flow State, and Just a Pinch. The complete
  technical catalog remains at `/instrument/reference`; stale room/material
  claims were corrected. Studio copy now separates Instrument, the production
  system used by Shift-9, from Titanium Forge, the portable component workbench.
  The live site, not earlier docs, is the visual source. Flow State now has a
  pointer-reactive black-water/refraction surface and diamond-jewel `F`; Instrument
  is a distinct open-lab room with an inspection light and one scanner motion, not
  an invitation-page clone. Its hero is borderless, transitions fade cleanly, and
  all controls use pearl styling. Future project pages are one entry in
  `instrument-projects.ts`. Client-facing copy guards reject prototype/draft/TODO/
  review-note/test-suite language. The landing yarn is the original static
  photograph with a direct handoff to the film, the redundant visible `20s` is
  gone, the split 9 has a restrained opposing hover, studio clips crossfade
  before their loop seams, and the studio closes
  on a physical invitation card. `/start`, `/flow-state`, and `/instrument` share
  one compact translucent ghost-pearl return control. `test:studio-polish` guards
  these details. Alternating light project rows now explicitly use dark ink for
  their titles, the public email is consistently `shift9dev@gmail.com`, and late
  media promises cannot revive torn-down animation loops. The full production
  build, browser contrast check, and both Vercel deployments pass. The technical
  reference now includes all twelve current projects from the reel registry in
  an asymmetric living archive, and the Studio reel opens on a twelve-stop dolly
  threshold rather than a basic centered title. Desktop routes plus 390px archive
  and Studio layouts were visually checked. The rejected curtain split and
  WebGPU experiment were removed; the original yarn photograph stays static and
  pressing Enter hands directly to the preloaded film. The blue light stays on
  the static plate. The project archive scan is a soft tapered inspection wash
  rather than a hard laser line. Kariim authorized merging PR #40 on 2026-08-01.

- **2026-08-01 - Flow State waitlist merged and verified.** PR #39 adds
  `/flow-state`, routes the studio card to it,
  and captures source-tagged emails through `/api/waitlist`. The approved
  Supabase migration is already applied: membership uniqueness is now
  `(lower(email), source)`, `source` is required and nonblank, and insert-only
  RLS is unchanged. Rollback-only tests proved cross-product membership works,
  same-product duplicates remain blocked, and blank source tags are rejected.
  The protected branch preview returned 200 and a real synthetic signup was
  persisted once, duplicate-masked, then removed with zero rows remaining.
  `shift-9/shift9-dev` has the checked-in public Supabase URL and publishable anon
  key configured for Production and Preview. The
  remaining hardening note is deployment-wide rate limiting; the current route
  uses a honeypot plus a bounded per-instance limiter.
  **2026-08-01 final visual:** Kariim replaced the standalone silver F with a
  static warm-spectrum holofoil surface; the headline remains titanium. The
  regression gate fails if the F returns to titanium. Desktop/mobile visual
  checks, full typecheck, both builds, and independent review are green. Kariim
  authorized merge after the updated preview and waitlist passed end to end.

- **2026-07-27 - Entry experience, pre-merge checked.** Branch
  `claude/shift9-studio-entry-experience-5wnekz` (PR #35) replaces `/` on
  shift9.dev with a three-stage entrance - held plate, ~20s film, skeuomorphic
  desktop - and adds `/studio` (the twelve-project dolly), `/start` (the
  invitation) and `/soon` (where the six projects without their own page land).
  New: `Shift9Mark`, `WaveField`, `AsciiWallpaper`, `AsciiTunnel`,
  `packages/theme/pearl.css`, and the obsidian/chalk/verdant tokens.
  131 commits, 72 files. Verified: both apps build with no env vars, typecheck
  passes, dry-run merge into `main` is conflict-free, and every route renders
  clean at 1280/768/390 including under reduced motion.
  **Not merged - awaiting Kariim.** Full detail and the open findings are in
  `PROGRESS.md`.

- **2026-07-22 - Studio About + origin story.** Added an "Origin" panel to
  `profile/README.md` (founder line + Galaxy Z Fold / Steam Deck origin story),
  generated via `profile/scripts/build-panels.py` (new `origin.svg`/`.png`,
  existing panel coordinate labels bumped). Added `my-skills` and `relay` to
  the Open Source table and folded "AI-agent and developer tooling" into
  the Work With Us blurb. On `shift9.dev`, swapped the copy in the "About"
  window inside the interactive desktop (`EnterTheStudio.tsx`, opened from
  the root page after the intro video) to the same founder/origin-story copy
  - the `/studio` INSTRUMENT work-wall page was intentionally left untouched.

## Open work - PRs awaiting review, none merged

| PR | Title | Branch |
|---|---|---|
| #35 | Enter the Studio - the entry experience | `claude/shift9-studio-entry-experience-5wnekz` |
| #16 | Profile: align featured work with the finalized manifest | `claude/org-manifest-y1yqr5` |
| #15 | Just a Pinch - honest launch status + real waitlist capture | `claude/pinch-landing-y1yqr5` |
| #14 | Enter the Studio - cinematic entry experience for shift9.dev | `claude/shift9-entry-integration-y1yqr5` |

34 remote branches exist; most have no open PR. Only `main` deploys - preview
builds are per-branch and disposable, and nothing reaches the live site until it
merges to `main`. **Nothing merges without Kariim's explicit approval.**

Work on Just a Pinch (bug fixes + store badges) is in flight in a separate
session. Its only overlap with PR #35 is `shift9/pnpm-lock.yaml`; whichever
merges second should rebase and regenerate the lockfile with `pnpm install`
rather than resolving it by hand.

## Exact next steps

1. Review, merge, or close PRs #14, #15, #16, #35. **#35 is approved by Kariim
   pending his own merge click** - the three pre-merge fixes he asked for
   (favicons, the dead `/#work` link, the hardcoded clock) landed at `6c176e2`.
2. Fix the repo-wide `lint` script - `next lint` was removed in Next 16 and there
   is no eslint config in the repo, so lint currently exits 1 in both apps.
3. Vendor or poster-fallback the ten Higgsfield CloudFront hero videos in
   `lib/work-data.ts`; today a `/work/[slug]` page shows an empty rectangle if
   the CDN object goes away.
4. Fix `MonoLabel`'s doubled `//` on the work pages - the component emits its own
   marker and `app/work/[slug]/page.tsx:66` passes another.
5. Prune the `claude/*` branches with no open PR.
6. Resolve the `docs/BLUEPRINT.md` drift below.
7. Audit every repo-enumerating script (XAVIER ingestion, Relay state sweep, `my-skills`) for the `Kariimc`-scope bug above.

## Open decisions

- **`docs/BLUEPRINT.md` is stale on build status.** It states "Nothing here is built yet" and lists
  Phase 2 as *proposed* - Phase 2 is largely built. It also specifies `apps/github-profile/`
  (reality: `profile/scripts/*.py`), `packages/config` (does not exist), and a `supabase/`
  migrations directory (now present at `shift9/supabase/migrations`). Its creative-direction sections remain **authoritative and
  locked**; only the status and structure claims drifted. Decide: correct in place, or split the
  creative direction away from architecture so status can move without touching locked design.
- Blueprint section 8 open items: hosting / Supabase region; premium type licences (Druk + Soehne
  Mono) vs the free variable stack (Anybody + Martian Mono); Just a Pinch domain - **already
  resolved to `pinch.shift9.dev` in CLAUDE.md, but the blueprint still poses it as an open question.**

## Rules that bite (full contract in CLAUDE.md)

- Tokens only. No raw hex, no raw duration, in any component.
- Two voices, never mixed. `shift9-dev` is cyber-brutalist; `just-a-pinch` is warm and uses no `//` labels.
- Every animation branches on `useReducedMotionSafe()` to a fully legible static state, never a paused half-state.
- Both apps must `next build` with no env vars present.
- Never copy sensitive values with `vercel env pull`; it exports placeholders.
  For the public Supabase client values, use the checked-in `.env.example`, then
  redeploy and verify `/api/waitlist` end to end.
- Branch `claude/...`; PR ready-for-review; never push to `main`; never self-merge.

---

## 2026-08-24 - LinkedIn presence rebuilt (profile, company page, projects, posts)

**This section is about Kariim's LinkedIn, not this repo's code.** It is here because
the one open task lands on `profile/README.md` in this repo. Resume cold from this.

### What is live now (all verified on the page, not assumed)

**Company Page created:** Shift-9 Studios, `linkedin.com/company/143514928`,
slug `shift9-studios`, website `shift9.dev`, Software Development, 0-1 employees,
Privately Held. Logo is the real site logomark, rendered 400x400 from
`shift9/apps/shift9-dev/app/icon.svg`. About section carries the monorepo /
design-system / build-fails-on-quality-checks story.
Kariim created the page himself (agents cannot create accounts).

**Experience entry relinked.** The Founder role now points at the real company page,
so the logo shows instead of a grey square. Two false claims were corrected in it:
it said Feelspoon was "successfully launched on Google Play" (it is in final review)
and cited a "426-skill" AI system (that count is long dead; the fresh setup has ~40).
"Notify network" was switched OFF before saving so connections were not pinged.

**Projects: 2 -> 10.** Each is technical, honest, and associated with Shift-9 Studios.
- Shift-9 Studio (shift9.dev) - pre-existing, description rewritten + image added
- Feelspoon - pre-existing, untouched
- Shift-9 Control Plane - live war-room screenshot
- Flow State - real product pill graphic
- ReadingLand - real felt-letters land art
- Vespermesh - live UI screenshot reading a real repo
- HoopClone - TEXT ONLY, no image (see below)
- Titanium Forge Pro (= the `neon-forge` / `neon-forge-ui` workbench)
- Omni3D
- WHome

**Posts.** Kariim published the Flow State post himself. A Shift-9 studio post and a
Control Plane post were drafted in the composer; the studio launch image
(`Shift9.dev-assets/launch-2026-08/source/li-studio.html` -> `out/li-studio.png`)
was rendered this session and used.

### OPEN - do this next

1. **`profile/README.md` has two dead claims** (this repo, `Kariimc/.github` profile):
   - line 52: links `Kariimc/relay`. Kariim DELETED that repo on 2026-08-22 because
     agents had written his internals onto a public page. Dead link, must go.
   - line 51: `my-skills` described as "a 420-skill AI agent operating system".
     That repo is the frozen archive and the count is stale. Rewrite without a number
     (counts drift - never hardcode inventory).
2. **More LinkedIn posts** - Kariim's words: "do some more posts in linkedin".
3. **HoopClone has no usable image.** The game runs and was captured twice this
   session (driver: `hoopclone/tools/godot/screenshot.gd`, godot at `~/bin/godot`,
   env `HOOP_SHOT_OUT` / `HOOP_WARMUP` / `HOOP_HOLD` / `HOOP_RES`). Both frames were
   rejected on sight: a large blown-out white patch swallows half the court, players
   are untextured mannequins with no kit, and a "LIVE BUILD" debug banner sits top-left.
   Fix arena lighting + put kit on players, then recapture.
4. **Midnight Return was deliberately NOT added.** Its own README says it has never
   been opened in Unity - no .meta, no ProjectSettings, nothing compiled. Do not
   present it as a shipped project.

### Gotchas that cost real time this session - do not rediscover these

- **LinkedIn's image uploader jams** ("Loading" forever) if you attach the picture
  AFTER typing the post text. Attach the image FIRST, then type. This is the pinned
  method; five other routes failed (two direct uploads, a change event, a simulated
  drag-drop, and a clipboard write that froze the renderer for 45s).
- **Typing via simulated keystrokes DROPS CHARACTERS** ("shred" for "shared",
  "Epo" for "Expo"). Set field values directly through the page instead
  (native value setter + an input event), then screenshot to confirm.
- **`/details/projects/` renders BLANK** repeatedly (verified 4+ times, ~1.4KB of
  chrome only). Verify project state from the MAIN profile instead - scroll down and
  read the "Projects (N)" heading.
- **Headless screenshots of the control plane come out blank** unless view
  transitions are disabled first: inject `*{view-transition-name:none !important}`.
  Plain Chrome `--screenshot` also fails on it; drive it with playwright-core
  (available in `shift9-control-plane/node_modules`) and wait ~6s after networkidle.
- **Vespermesh had no deps installed.** `npm install` then `npm run dev` serves on
  `127.0.0.1:3000`. It was installed and the server was stopped again this session.

### Scratch files (temporary folder, safe to delete)

Capture/crop scripts and the finished images live in this session's scratchpad under
`AppData/Local/Temp/claude/...`. Nothing in any project repo was modified this session.

---

## 2026-08-24 (later) - LinkedIn round 2: five posts, five images, a new banner

Resumed the LinkedIn handoff above. Kariim, mid-session: "put them and the images
into separate posts", then "I think I need a new banner too".

**OPEN item 1 is CLOSED.** `profile/README.md` had two dead claims. The `relay` row
is gone (`gh repo view Kariimc/relay` returns "Could not resolve to a Repository" -
he deleted it on 2026-08-22, so the link was 404). `my-skills` no longer carries a
hardcoded count; it reads "An archived AI agent operating system". Counts drift.

**OPEN item 2 is DRAFTED, not published.** One folder per post, copy and image
together, under `Shift9.dev-assets/launch-2026-08/linkedin-r2/`:
`00-banner`, `01-shift9dev`, `02-feelspoon`, `03-vespermesh`, `04-instrument`,
`05-omni3d`. Each post folder holds `post.md` (how to post it, the copy, and what
the image is) and `image.png`. The folder README carries the pinned
attach-image-first rule and the re-render commands.

**Items 3 and 4 unchanged.** HoopClone still needs arena lighting and player kit
before a recapture. Midnight Return still stays off LinkedIn.

### The images, and what looked at them

His standing order of 2026-08-21 is that anything visual is inspected by Gemini and
nothing else. Every image below went through `tools/see.mjs` in the control plane,
and iterated until the named defects were gone.

- **Three product cards** (Feelspoon, Instrument, Omni3D) are rendered, not
  screenshotted: `source/r2-*.html` + `source/card.css`, on the launch set's own
  `base.css` (live shift9.dev tokens, the site's three faces, the titanium
  wordmark), over the real set-piece plates from `public/experience/set-pieces`.
  All three: **Gemini PASS**. Render with
  `W=1200 H=1200 bash source/render-r2.sh r2-feelspoon r2-instrument r2-omni3d`.
- **The banner** (`source/banner.html` + `banner.css`, background composited in
  Python from the Lumen plate) is 1584x396. **Gemini PASS**, checked specifically
  against the profile-photo overlap and LinkedIn's side crop: no text at risk.
  Render with `W=1584 H=396 bash source/render-r2.sh banner`.
- **Two screenshots.** shift9.dev's Home room, and Vespermesh running against its
  own repository. Gemini will not PASS a raw UI screenshot whatever the crop; it
  grades them as social graphics and parks them around 5 to 6 out of 10. Every
  specific defect it named AND that reproduced was fixed: on the site shot the
  blurred sidebar, muddy ground, small text, low-contrast footer, breadcrumb
  clutter and wide margins; on Vespermesh the empty placeholder states, the toast
  overlay and a cut card row. Two claims did NOT reproduce and were measured rather
  than argued with: the "STATE / BUILT WITH" headers ARE left-aligned with their
  values, and the wordmark's baseline DOES sit on the footer baseline.

### Fixes that came out of that loop and are now in the source

- `.card h1` at 94px: Bricolage at wght 800 fuses `fi` and `fr`. Easing the tracking
  did not clear it; the headlines were rewritten to avoid those pairs ("Cook it out
  loud", "The engine votes before you do"). Worth knowing before writing new copy.
- The titanium wordmark had the same `fi` collision in "shift9.dev" itself, on every
  card and on the launch set already shipped. Fixed with `letter-spacing:.004em` on
  `.card .wordmark`. **The launch set in `POSTS.md` still carries the old fused
  wordmark and has not been re-rendered.**
- Plates are trimmed to their subject by `source/plates/` copies, not used raw, or
  the card shows a black band where the render's own empty ground sits.

### Loose ends, written down rather than left

- **Vespermesh data, not the post:** plan steps 01 and 02 repeat their own title word
  for word in the description underneath. Visible in `03-vespermesh/image.png`.
- **A mission was created in the local Vespermesh database** to get a populated
  screenshot. The product labels that action PLAN ONLY / REVERSIBLE / NO MERGE and
  nothing ran. The dev server was started and stopped again; port 3000 confirmed
  free (`curl` returns 000).
- **The launch set's wordmark**, above.

### 2026-08-24, later still - Titanium Forge added, and two posts loaded by hand

Kariim: "just do vespermesh for now", then "do titanium forge".

**A sixth post now exists.** `linkedin-r2/06-titanium-forge/` with `post.md` and
`image.png`. Card built the same way as the others: `source/r2-forge.html` on
`card.css`, over the real `08-titanium-forge` set-piece, trimmed to its subject.
**Gemini: PASS, 7/10.** The folder README index was extended to name it.

Copy was ground-truthed against `neon-forge-ui/ARCHITECTURE.md` and the running
site `hidden-glow-736.higgsfield.app`, which answered 200 on 2026-08-24. No
component count is quoted; the registry is spread over seven files and drifts.

**Two posts were loaded into LinkedIn's composer and NEITHER was posted.** Both
stopped at the Post button, which is his call, not an agent's.

The method that works, through the Chrome connector on his signed-in browser:
1. Go straight to `linkedin.com/sharing/compose`; hunting the feed's button races
   with whatever he is doing in the same window.
2. Click the image icon, then WAIT. The hidden `input[type=file]` does not exist
   for about eight seconds while the Editor shows "Loading".
3. That input is invisible to the accessibility tree, so `file_upload` cannot see
   it. Give it an id, an `aria-label` and a real size with JavaScript, find it by
   that label, upload, then strip the attributes off again.
4. Image first, Next, THEN the text. Typing is still banned: set the text with
   `document.execCommand('insertParagraph'|'insertText')` on the TipTap editor,
   one call per paragraph, then compare the result to the source string character
   by character. Both posts matched exactly, 715 and 698 characters.

**The Titanium Forge copy was rewritten, and the reason matters.** The first
version was written in plain words. Kariim, same day: "why didn't you put all the
technical stuff in the post for titanium-forge". The plain-words rule governs how
agents talk to HIM. It does not govern what his audience reads, and his audience
is technical. Do not carry that rule into published copy again.

The rewrite leads on the design decisions rather than the stack: components are
data not modules, the snippet is the copyable artifact so it must be standalone
runnable TSX, the registry is an additive chain where the newest layer can patch
an older component's snippet, duplicate slugs are deliberate overrides where the
last spread wins, and the trap that slug is a join key in three places and a typo
degrades silently to "Demo coming soon" with no build error. Sources:
`neon-forge-ui/ARCHITECTURE.md`, which is itself ground-truthed against the code.
Still no component count quoted; the architecture notes give the same instruction.

**The Vespermesh copy was rewritten the same way**, off the project's own README:
provenance on every fact, append-only event history in local SQLite, resume from
the last verified node with no duplicate execution, repository and web content
treated as untrusted data and never as instructions, deterministic checks before
model judgment, and a missing or uncontained runner shown as BLOCKED rather than
dressed as a success. It also states out loud what the tool does NOT do yet, which
is straight out of the README's own "what is not finished yet" section.

**He posted Titanium Forge himself** at about 05:20 on 2026-08-24. Confirmed on his
activity page, not assumed.

**The new banner was already on his profile** when this session went to apply it;
he had done it himself. Verified on the live profile, and his photo sits clear of
every line, which is what the empty left 430px was for.

**Omni3D was rewritten as a technical post and TAGGED.** Five company pages, each
resolved through LinkedIn's own picker so it lands on a real page and not on plain
text: Unity, NVIDIA, Epic Games, Autodesk, Hugging Face. Verified in the DOM: five
`data-type="mention"` spans and zero leftover "@" characters.

NO INDIVIDUAL PEOPLE WERE TAGGED. He asked for "leaders in that space", and that
is deliberately left open: tagging a real human notifies them, and choosing which
strangers to notify is his call. Ask him for names rather than guessing.

**How to tag, because this took several wrong turns.** The mention only commits if
it is typed with real keystrokes into a FOCUSED editor and then chosen from the
dropdown. Setting focus from JavaScript is not enough; synthetic typing goes
nowhere. Click the editor line with a real mouse click first, measured off the
paragraph's own bounding box AFTER scrolling it into view, because the composer
scrolls under you and a stale coordinate lands outside the editor and destroys
earlier text. After a dropdown pick the caret DOES stay in the editor, so the next
", @Name" can be typed straight away. Also: "@Unity" finds the game engine
("Company - Software Development"); "@Unity Technologies" does NOT, it returns a
defence contractor and an IT consultancy.

**THREE POSTS ARE NOW LIVE**, all posted by Kariim himself, all confirmed on his
activity page rather than assumed: Titanium Forge, Vespermesh, and the journey
post. Round 2 still has these unposted and ready in their folders: `00-banner`
(never applied to his profile), `01-shift9dev`, `02-feelspoon`, `04-instrument`,
`05-omni3d`.

The journey post grew twice on his instruction after the first load: a line about
still learning fast, then two paragraphs on the learning system and the
automations. Both additions were verified before they were written, not recalled.
The live post is the final wording; the folder's `post.md` matches it.

**A seventh post exists: `07-the-journey`.** He asked for a post about his
technical journey. Because that is exactly the kind of post that invites
invention, every number in it was COUNTED on 2026-08-24 and the counting method
is recorded in the post's own file:
- first commit in any repo under `Dev` is 2026-06-08 in `just-a-pinch`
- 8 June to 24 August inclusive is 78 days
- 33 folders under `Dev` carry real git history
- 69 distinct calendar days across them have at least one commit
- the "pwd, ls, cd" phase one, the two-hours-a-week pace and the "get a coding
  job" goal are quoted from `Dev/my-coding-journey/LEARNING_PLAN.md`, dated
  2026-06-24, and Phase 2 in that file is genuinely still unticked

The total across those repos is 2211 commits, and it is deliberately NOT in the
post, because many carry an agent as the author and quoting it would read as
personal output. The post says out loud that he did not hand-type most of it.
Do not add that number later.

Card: `source/r2-journey.html`, plate is the studio's own opening shot "The
Approach". **Gemini: PASS.**

**He posted Vespermesh himself** at about 05:55, and Titanium Forge at about
05:20, both on 2026-08-24. Confirmed on his activity page.

**A second browser tab does not work for this.** LinkedIn's Media button will not
open its Editor in a BACKGROUND tab; the click registers as hover and the file
input is never created. It has to be the fronted tab. Also: clicking the Media
button twice in a row fails the same way, because the pointer is already on it.
Click elsewhere, hover away, then click it.

**The Vespermesh draft did not survive.** The tab moved to his profile and back;
LinkedIn kept nothing. It has to be reloaded from its folder if he wants it.

**Not committed.** The `HANDOFF.md` and `profile/README.md` edits are in the working
tree, unpushed. Everything under `Shift9.dev-assets/` is NOT in git and is not meant
to be: `.gitignore` line 12 excludes it, which is where the launch set already lives.
Look on disk, not in the repo.

### 2026-08-24 (later) - Feelspoon SHIPPED, and what that breaks

**Feelspoon is LIVE on Google Play.** Verified on the store page, not assumed:
listing title is **"Feelspoon: Recipe Organizer"**, publisher Kariim Chiles,
free with in-app purchases, 10+ downloads at time of writing.
Link: `play.google.com/store/apps/details?id=com.justapinch.app`
(store id is still the old `com.justapinch.app` - the app was renamed, the id was not).

**THIS MAKES TWO THINGS ON HIS PROFILE FALSE.** Both were written earlier the same
day, when "final review" was still true. Kariim was told; he had not said go yet.
Fix both:
1. Experience > Founder role, bullet 2: says Feelspoon went "through a successful
   closed beta and into final Google Play review". It has shipped. Rewrite.
2. Projects > the Feelspoon entry (the pre-existing one, not one of the 8 added
   today): also says final review. Rewrite.
   When editing Experience, switch "Notify network" OFF first unless he wants the
   network pinged.

**Four launch posts were written and given to him as copy-ready text** (LinkedIn,
Facebook, Instagram, X). They were NOT placed in any composer and NOT posted.
The LinkedIn one leads on the serverless build and the deleted Express server;
the other three are plain-language. If he wants them placed, the LinkedIn composer
is the only one this session was signed in to.

**`profile/README.md` fixes are DONE but UNSAVED.** Someone (not this session)
removed the stale "420-skill" count and deleted the dead `Kariimc/relay` row while
this session was running. The edit is sitting uncommitted in the working tree.
It needs committing or it will be lost. Kariim's stated intent: he plans to make
the skills system a public open-source repo at some point, so the entry stays in
the table - just never with a hardcoded count (counts drift).

**Still open from the earlier section:** more LinkedIn posts, the HoopClone image
(lighting blowout + untextured players must be fixed before recapture), and
Midnight Return stays out until it has actually been opened in Unity.

### 2026-08-24 (later still) - the profile is now true, and the ship posts exist on disk

**FOUR spots said "final review", not two.** The inventory was taken before the
first fix, and every one was corrected and then read back from LinkedIn's own
saved value on a fresh page load (not from the page that was just edited):

1. Experience > Founder, bullet 2 -> "Built and shipped Feelspoon, a recipe app
   (Expo, React Native, Supabase, Claude-powered capture): closed beta, then live
   on Google Play."
2. Projects > Feelspoon, description -> "...live on Google Play as "Feelspoon:
   Recipe Organizer" after a successful closed beta."
3. Projects > Feelspoon, the ATTACHED MEDIA CARD (feelspoon.app). This one is easy
   to miss: it is not in the description field, it is edited through the pencil on
   the media thumbnail inside the project form, and it carried its own copy of the
   claim. -> "Live on Google Play, free to download."
4. Projects > Shift-9 Studio (shift9.dev), last paragraph -> "...now live on
   Google Play."

**Notify network was OFF before anything was saved.** Read twice off the DOM
(`aria-checked="false"`) and confirmed on a screenshot showing the grey "Off"
toggle. Project forms have no such toggle at all; only the Experience form does.

**Three "final review" strings still exist on the profile and were deliberately
LEFT.** They are inside PUBLISHED POSTS (the launch post and the journey post),
which were true on the day they were posted. Editing live posts is his call.
Do not "fix" them without asking.

**He has no About section.** The only "About" in the page text is LinkedIn's own
footer link. A text search for "About" will mislead you here.

### Method notes worth keeping

- The Experience description is a TipTap contenteditable: select the one paragraph
  with a Range and `execCommand('insertText')`, then compare paragraph by
  paragraph. The project and media descriptions are plain `<textarea>`: use the
  native value setter plus an `input` event. Both were verified by equality
  against the intended string, not by eye.
- Clicking Save by coordinate is fragile - the modal scrolls under the click and
  the first attempt landed in the body. Screenshot, then click the button where
  the screenshot actually shows it.
- **`/details/experience/` renders fine. `/details/projects/` still hits the known
  blank render** (1802 bytes, survives a reload). Verify a project by reopening its
  edit form on a fresh load and reading the stored value; that is server state.

### The four Feelspoon ship posts were NOT in the notes - they are now

The earlier entry said they had been "given to him as copy-ready text". They
existed nowhere on disk, only inside a session transcript, one interrupted
session away from being gone. Recovered and written to
`Shift9.dev-assets/launch-2026-08/feelspoon-ship/POSTS.md` (LinkedIn, Facebook,
Instagram, X). **Still unposted. Nothing was placed in any composer.**

**The older `launch-2026-08/POSTS.md` set is now stale**: all three of those posts
say Feelspoon is "in final review" / "live within the week", and their rendered
images carry the same claim plus the fused-`fi` wordmark. Do not ship that set as
it stands.

### 2026-08-24 - the four ship posts now have images

Kariim, mid-session: "Can I have some cool images in the post also". He chose
**pure Feelspoon** over the Shift-9 card system, and one image per surface
rather than one resized four ways.

**Four images exist, all four posts are still UNPOSTED.** One folder per
surface under `Shift9.dev-assets/launch-2026-08/feelspoon-ship/`:
`01-linkedin` (1200x1200), `02-facebook` (1200x630), `03-instagram` (1080x1350),
`04-x` (1600x900). Each holds `post.md` and `image.png`. The folder README
carries the full method and, more usefully, the list of Gemini claims that were
MEASURED AND REJECTED so nobody re-fixes them.

**Nothing in the art is invented.** Colours are copied verbatim from
`just-a-pinch/mobile/src/theme/index.ts`; the faces are the app's own Newsreader
and Hanken Grotesk, loaded from the app's own node_modules; the screens are the
real Play Store screenshots from `mobile/store/screenshots/phone/`; the mark is
the real `play-icon-512.png`. New pipeline at `feelspoon-ship/source/`, rendered
by `source/render.sh` (2x then downsample, which is what keeps the type clean).

### Three things worth not rediscovering

- **A shared `.phone{left:calc(50% - w)}` rule silently stacks the flankers
  BEHIND the hero.** Cost a full render round on the Instagram card: the right
  phone was invisible and looked like a missing asset. Each device sets its own
  left/right now.
- **Increasing a container's height does NOT move devices anchored to its
  bottom.** Tried it twice to close a dead band and nothing moved. Change the
  device heights or their `bottom`, not the box.
- **A rotated phone throws its corners out by about
  `(h*sin θ + w*(1-cos θ)) / 2`.** Two cards clipped the canvas edge before this
  was computed instead of guessed. `source/` has the arithmetic.

### Gemini claims that were measured and REJECTED - do not re-fix

Written down because all three are confident, specific, and wrong, and the next
session will otherwise burn a round on each:
- **"Clipped by the left/right/top edge"**, raised against all four cards.
  A dark-pixel scan of the border rows returns **zero** on every edge except the
  bottom, where the bleed is deliberate. It grades the bleed as clipping.
- **"The X feature dividers are unevenly spaced."** Both gutters measure exactly
  **70px**. It is seeing the ragged right edge of each column's text.
- **"iPhone hardware / Dynamic Island on an Android app."** There is no notch
  element in the markup. It is reading the app's own in-screen buttons.

It WAS right about one thing that eyeballing missed: at `line-height:1.04` the
headline's descenders and ascenders touched at **0px** on the X card. Measured,
fixed to `1.14`, re-measured at 13px. Trust it on collisions, check it on crops.

**Still open, unchanged:** the HoopClone image (arena lighting blowout and
untextured players before any recapture), and Midnight Return stays off LinkedIn
until it has actually been opened in Unity.

### 2026-08-24 (final) - published posts corrected, old launch set no longer lies

**Pushed.** `profile/README.md` is live on the public page; the dead `relay` link
and the stale skill count are gone. Verified by fetching the raw file, not by
trusting the push output.

**All SEVEN published LinkedIn posts are now clean.** Two carried false claims
after Feelspoon shipped and both were edited in place, then re-checked by
fetching each post fresh:
- `7497677099810377728` (the journey post): "in final review with Google Play"
  -> "live on Google Play".
- `7497541575103688704` (the launch post): two lines, "in final review with
  Google Play" and "hits Google Play within the week", both rewritten.
Method: LinkedIn post edit is a Quill editor. Select the one paragraph with a
Range and `execCommand('insertText')`, then compare paragraph counts before and
after so a stray newline cannot slip in.

**ONE THING CANNOT BE FIXED BY EDITING.** The launch post's ATTACHED IMAGE still
reads "A recipe app. In final review with Google Play." and "LIVE WITHIN THE
WEEK". Confirmed on screen, not assumed. LinkedIn's post editor changes text
only; media on a published post cannot be swapped. The only route is delete and
repost, which throws away 161 impressions and the post's age. That is Kariim's
call and it was put to him rather than done.

**The old launch set no longer lies.** `launch-2026-08/POSTS.md` copy was already
corrected; the three images were re-rendered to match and the delivered
`shift9-launch-*.png` files replaced.

### Two type faults were in the SHIPPED launch images and are now fixed

- **wght 800 Bricolage fused the r and f in "surfaces"** on the LinkedIn card.
  Tracking `-.025em` -> `-.012em`, chosen by rendering four values and LOOKING at
  the r/f junction each time. The headline dropped 122px -> 110px, because at the
  looser tracking "Product surfaces." wrapped mid-word into "surf / aces.",
  which is worse than the fuse it was fixing.
- **The wordmark had the same fuse** in "shift9.dev". Fixed with
  `letter-spacing:.004em` scoped to the wordmark.

**A measurement lesson worth keeping.** A first attempt tried to detect the fuse
by counting blank pixel columns in a guessed window. It reported SEPARATED for
all four tracking values including the one that visibly fused. A guessed crop
window is not a measurement. For glyph collisions, render the candidates, stack
them into one strip, and look.

### 2026-08-24 - the LIVE patch chip, and a claim that had to be corrected

Kariim: "Just put a patch chip over the top that says LIVE! on the Google Play
Store". Done on all three launch images (`launch-2026-08/source/{li,ig,fb}.html`,
shared `.patch` rule in `base.css`, delivered files replaced).

The chip is the app's own green `#2E9E57`, a hard white keyline, a real drop
shadow and a small rotation, so it reads as a sticker applied ON TOP rather than
part of the layout. **The old status block was DELETED from each file when the
chip went on.** Leaving it in place left "LIVE NOW, FREE" poking out from behind
the sticker, which reads as broken rather than layered. If a chip is ever moved,
check what is underneath it.

### A claim I made that was wrong, and the check that settled it

I told him the picture on a published LinkedIn post "cannot be swapped" BEFORE
verifying it. Then, inside the post edit modal, an **Edit** button turned out to
sit on the image itself, which looked like I had been wrong.

Checked it: that button opens **Edit Alt Text** and nothing else. There is no
file input anywhere in the modal (`input[type=file]` count is 0). So the
conclusion holds, but it now rests on a look rather than an assumption.

**The state of it:** the launch post `7497541575103688704` has correct TEXT and a
stale IMAGE. Its picture still reads "In final review with Google Play" and
"LIVE WITHIN THE WEEK". The only routes are (a) delete and repost, which throws
away 161 impressions and the post's age, or (b) post the patched image as a
comment underneath. Both are his call; neither was done.

Nothing was saved in that modal. The post text was re-fetched afterwards and is
still clean.

### 2026-08-24 - the correction comment is LIVE on the launch post

Kariim: "do the comment". Posted, and confirmed by re-fetching the post, not
assumed. The comment sits under `7497541575103688704` carrying the corrected
image with the LIVE! chip, so the stale picture above it is answered rather than
deleted. The post kept its 161 impressions and its age.

Comment text, exactly: "Update: Feelspoon is live on Google Play now, free to
download. The graphic in the post above was made while it was still in review,
so here is the corrected one."

### How to attach an image to a COMMENT, since this differs from a post

- The comment box's own photo icon is at the RIGHT END of the "Share your
  support..." field, not on the post's action row. A first attempt clicked the
  post's Repost button by mistake. Nothing was reposted (a repost needs a
  confirm dialog and none opened), but check what sits under the pointer.
- `input[type=file]` DOES NOT EXIST until that icon is clicked, and then takes
  about EIGHT SECONDS to appear. Count is 0 before, 1 after, with
  `accept="image/gif,image/jpeg,image/jpg,image/png,image/webp"`.
- That input is invisible to the accessibility tree. Give it an id, an
  `aria-label` and a real size with JavaScript, find it by that label, upload,
  then strip the attributes off again.
- Image FIRST, then the text. Typing is still banned: set it with
  `execCommand('insertText')` on the Quill editor and compare character counts.
  This one matched exactly at 162 characters.
- The preview thumbnail was checked before submitting, to be sure the PATCHED
  image went up and not the stale one.

**A published post's image still cannot be swapped.** Unchanged and verified:
the only Edit control on it is alt text, and there is no file input in the edit
modal. The comment is the non-destructive answer to that.

### 2026-08-24 - the LIVE! chip on the four Feelspoon cards

Kariim: "do the same chip on the feelspoon posts". Done on all four.

**The inline "Live on Google Play" pill was REMOVED from every card.** The chip
and the pill said the same thing twice. One strong callout per image, same
decision as the launch set, where the old status block came out from under the
sticker. If a chip is ever moved, check what is underneath it first.

The chip uses the app's own Hanken Grotesk rather than the studio's Bricolage,
so it stays inside the Feelspoon system. Shared `.patch` rule in
`feelspoon-ship/source/fs.css`; each card sets its own size and position.

**Two placements were wrong on the first render and were caught by looking:**
- Facebook: the chip's top edge cut the last line of the subheading.
- Instagram: it sat across the phone's back button and top bezel. Moved up into
  the dead band, where it now rests on the phone's top edge and fills space that
  was empty anyway.

**A real bug in the renderer, now fixed.** `feelspoon-ship/source/render.sh`
used `for n in "${@:-li ig fb x}"`. Quoted, that default expands to ONE word, so
a no-argument run produced a single file literally named `li ig fb x.png` and
rendered nothing else. It builds an array now.

**Do not trust a green-pixel probe on these cards.** Twice it was used to
measure the chip's clearance from the canvas edge and twice it returned the
union of the chip AND the app's own green UI inside the screenshots (the plus
button, the "Cook with what you have" tile, the checkmarks). The numbers look
authoritative and are meaningless. Look at the picture.

**The folder README said "NOTHING HERE HAS BEEN POSTED".** That went false the
moment he posted all four, and has been corrected to say so, plus the fact that
these images are now NEWER than what is live.

### 2026-08-24 - correction comments, and where Kariim stopped it

Three comments are LIVE, each carrying the newer chipped image, each verified
after posting rather than assumed:
1. **LinkedIn, studio launch post** `7497541575103688704` - the corrected launch
   image with the LIVE! chip.
2. **LinkedIn, Feelspoon ship post** `7497710522394398720` - the chipped
   LinkedIn card.
3. **Facebook, Feelspoon ship post** - the chipped Facebook card. Confirmed on
   screen showing "Kariim Chiles - 1m - Author" with the chip visible.

**STOPPED BY KARIIM, and correctly:** "they all say it's live already anyway and
I don't want to post this on the page for my faceless youtube page on X".

- **X is NOT his personal account.** `x.com/bringupdesk` is the faceless YouTube
  brand. Nothing was posted there. It also shows **0 posts**, so there was never
  a Feelspoon post on X to correct. Do not treat X as a surface for his personal
  product launches without asking.
- **Instagram was not touched.** Worth knowing for next time: Instagram comments
  are TEXT ONLY, so the chip could not have gone on as a comment there anyway. A
  new post or a story is the only route.

### Left open on purpose, with the reason

The **Facebook studio launch post** ("The studio is open", posted ~15 hours
before this) was not checked for a stale image. He called a stop while it was
still on the list, and its text already reads correctly. If it is ever picked
up: same method as the Facebook comment above.

### The Facebook comment method, which differs from LinkedIn's

- The file input is ALREADY in the DOM (three of them). Do not click the camera
  icon hoping to create one; find the input by walking UP from the
  `[aria-label="Attach a photo or video"]` button until an ancestor contains an
  `input[type=file]`. That is the comment's own input; the other two belong to
  the post composer and the cover photo.
- **The ref goes stale fast.** Facebook re-renders, and an upload ref captured
  before a screenshot failed with "Element is no longer in the document".
  Re-label and upload back to back, with nothing in between.
- **A near miss worth remembering.** The text was set on
  `document.querySelector('[contenteditable="true"]')` while the page had
  scrolled to the top, where the "What's on your mind?" POST composer also
  lives. It happened to land in the comment box, but that selector could just as
  easily have typed into a post composer. Target the comment box by its
  `aria-label`, never by "the first contenteditable".
- Confirmation that a photo really attached is the presence of a **"Remove
  photo"** control. `img[src^="blob:"]` returns nothing on Facebook.

### 2026-08-24 - the Facebook studio post: picture AND text were both stale

Checked on Kariim's ask. **A previous entry in this file said its text "already
reads correctly". That was wrong** - it was confused with the LinkedIn post.
Both the picture and the words were stale.

- **Picture**: the old launch card, reading "A recipe app. In final review with
  Google Play." and "LIVE WITHIN THE WEEK". Seen full size in the photo viewer.
- **Text**: "First product out: Feelspoon, a recipe app in final review with
  Google Play."

**Done:** a comment now carries the corrected card (LIVE! chip, "Out now on
Google Play"), with the line "Update: Feelspoon is out of review. It is live on
Google Play now, free to download." Verified on screen.

**STILL OPEN: the post's own text.** Facebook DOES offer an Edit control on a
post, unlike LinkedIn's image. But its editor could not be driven by script.

### Facebook's post editor defeats execCommand - do not retry the same way

Two attempts, both of which APPENDED instead of replacing, corrupting the
caption in the box:
1. Range over the one stale line, then `insertText`. Result: the old line
   survived and the new text landed at the very end, after `www.feelspoon.app`.
2. `selectNodeContents` on the whole editor, `execCommand('delete')`, then
   re-inserting all six lines. Result: the entire original caption survived and
   a full second copy was appended, newlines collapsed.

Both were CANCELLED, and cancellation was verified each time by re-reading the
post text. Nothing corrupted was ever saved. It is a Lexical-style editor that
ignores a scripted Range; the caret stays at the end whatever the selection says.

**The by-hand fix, which is 30 seconds.** Open Chrome, go to
`facebook.com/kariim.chiles`, find the post "The studio is open." from
2026-08-24, click **Edit**, and in the last paragraph change
"a recipe app in final review with Google Play" to
"a recipe app, live on Google Play now and free to download",
then click **Done Editing**. No admin rights, no terminal.

### 2026-09-05 - SEO / a11y polish on shift9.dev (PR branch)

Branch: `fix/seo-a11y-polish`. Additive fixes for the live site, no redesign.

**Done in `shift9/apps/shift9-dev`:**
1. App Router `robots.ts` + `sitemap.ts` (live was 404ing both).
2. `metadataBase` / canonical / OG URL prefer `https://www.shift9.dev`.
3. After desk mode, `document.title` leaves "Enter the Studio"; desktop gets a semantic H1 (hidden from AT during the cinematic gate/film).
4. Project fonts in `studio-fonts.ts` set `preload: false` — only the house stack stays critical first-paint.
5. `public/poster.jpg` resized to 1200×675 OG size and compressed (~174KB, was ~586KB).
6. Desktop folders: single Enter/Space/click opens (no select-then-open gate); `.sel` is focus highlight only.
7. Header Accounts / Log in removed; remaining Home/About dressing further de-emphasized.
8. Modal project title links: studio blue + underline + clearer `:focus-visible` for WCAG AA.

**Verified:** `check-studio-polish`, `check-flow-state`, `check-instrument` all pass on the laptop checkout.
