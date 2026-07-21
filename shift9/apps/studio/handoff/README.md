# Handoff: SHIFT-9 Studio — "The Uncut Soundstage" (shift9.dev/studio)

## For Claude Code — how to run this handoff

You are building the production version of shift9.dev/studio. Everything you need is in this
folder. Work **autonomously**: build → run → verify against the reference → fix → repeat, until the
production build matches the reference behavior and the visual contract. Only stop and ask the user
when a decision would (a) break the page, or (b) change anything from the vision defined by
`ORIGINAL_PROMPT.md` + the "Approved deviations" section below. Everything else — dependency
choices, refactors, file layout, shader ports, performance tuning — decide yourself and keep moving.

**Do not ask the user for any files.** This package is self-contained:
- `ORIGINAL_PROMPT.md` — the founding brief (source of truth; read it FIRST).
- `reference/` — the working prototype. `SHIFT-9 Studio.dc.html` opens directly in a browser
  (keep the four files together; `support.js` is its runtime). This is the behavioral spec.
- `assets/shift-9icon.png` — the SHIFT-9 app icon (white rounded slab + cyan "9" on dark navy).
- `assets/entrance-video.mp4` — the intro video (plays first, ends on black).
- Public repos for per-project truth (dossier copy is already extracted into the reference, but if
  you need more): github.com/Kariimc/{WinFix, titanium-forge-pro, lumen-projection-mapper,
  Learning-app, Flow-State, game-design-forge, Omni-3d, Midnight-return-, Bball, Hoopclone} and
  private {Just-a-pinch, xavier-agentic-os, relay, claude-eyes, agentkit, second-brain} (names only
  are used from the private ones).

## Overview

A cinematic WebGL/WebGPU portfolio site: one continuous damped-velocity camera dolly through 12
soundstage "sets" in a black void, one per project. Entrance: video → first-person 3D desk scene →
interactive Windows 11 screen → hyper-real "tunnel through the machine" dive → the studio.
Brand voice: precise, technical, cinematic, obsessive. Goal: Website of the Year 2027.

## About the design files

`reference/` is a **design reference built in HTML** — a faithful, working previz, not production
code to copy. Your task is to **recreate it in the production stack** mandated by the original
prompt: **Vite + TypeScript + Three.js with WebGPURenderer (primary), raw GLSL/TSL where required,
and a real post-processing stack (UnrealBloomPass, FilmPass, velocity/motion blur on the
periphery)**. WebGL2 fallback when WebGPU is unavailable. The reference runs plain WebGL with CSS
letterbox/grain standing in for the post stack — production replaces those approximations with the
real pipeline at "super high resolution" (renderer at device pixel ratio, no capped canvas).

## Fidelity

**High-fidelity.** Every constant, color, layout, easing, duration, z-position, copy string, and
interaction in `reference/` is intentional and user-approved. Recreate exactly; where production
post-processing (bloom/grain/motion blur) supersedes a CSS approximation, match the *intent*
(cinematic chiaroscuro, film grain, peripheral velocity blur) at higher quality — never remove it.

## Approved deviations from ORIGINAL_PROMPT.md (user decisions — binding)

1. **Dolly axis stays forward-Z** (camera translates −Z). The prompt's "left to right" describes
   set reading order only. Do NOT convert to lateral dolly.
2. **Set 10 Learning App**: the "floating concrete cube" was superseded by a **big colorful
   floating kids tablet** (coral case, yellow corner bumpers, screen cycling A/B/C over fun scenes
   with contrasting letter colors). Reference implementation is canonical.
3. **Set 09 Lumen Mapper**: the mapped object is a **stack of white boxes on the floor** (classic
   box-mapping installation), not a wireframe-caged icosahedron. Projection runs a loop:
   breathing grid → neon facet blocks → scan bars, with glitch flashes.
4. **"Hidden Win11 desktop triggers at velocity 0"** evolved into: idle dossier (tagline + spec on
   a scrim) + collapsible "ALL SETS 01–12" shortcut row (click → cinematic glide) + click-the-set →
   full-screen static dossier page. All user-approved; keep all three.
5. **Entrance sequence** (new, user-directed; not in original prompt): see "Screens" §1–§3.
6. Statuses: 12 Just a Pinch = LIVE; 05 Titanium Forge = V2 IN DEV; all others IN DEV.

## Screens / stages (in order)

### 1. Entrance video
Full-bleed `assets/entrance-video.mp4`, autoplays (attempt unmuted, fall back muted), object-fit
cover. Video ends on black → 0.9s opacity fade → desk scene. **Music replacement is a known open
item** — keep the audio pipeline swappable. No pre-gate page of any kind.

### 2. First-person desk scene (3D)
Seated POV, camera at (0, 0.56, 1.15) looking at the laptop, fov 60 — wide enough that the desk\u2019s side edges (desk is 2.2 wide) and the headphone stand are always in frame, subtle mouse-parallax
(±0.03/±0.02) + breathing sway. Dark room (#050607, fog 2.5→7), warm key spotlight #ffb377 from the
left (casts soft shadows), cool fill #3a4d70 right. Desk: wood-grain textured slab. On it:
- **HP EliteBook**: silver aluminum (color #b9bec6, rough 0.35, metal 0.7) base 0.62×0.016×0.42 with dark keyboard inset + trackpad; lid on a hinge group at the back edge. Laptop sits CLOSE to the viewer (group z −0.02).
- **XXL drafters mat**: 1.7×0.85, #16181d with a fine 32px grid texture.
- **Premium wireless mouse** in its own zone at (0.46, z 0.26) — clearly separated from the laptop: low-profile dark capsule (#2b2d33, rough 0.3), seam line, tiny cyan logo dot.
- **Brushed-aluminum control dial** (Surface Dial-class metal puck #c7ccd4, dark top inset, glowing cyan #35d5ee LED ring, hue-breathing).
- **Corsair Xeneon Edge in VERTICAL orientation**, left of the laptop on a metal stand, screen
  facing the user (yaw 0.38 toward center): dark bezel, portrait canvas UI running a live
  **calendar app with the ACTUAL date/time** (big clock, cyan weekday, huge day number,
  month/year, week row with today in a cyan disc, "SHIFT-9 · STUDIO DAY"), redrawn each minute.
  `drawEdge('news', [headlines])` is the built-in seam to switch it to a news feed — keep it in
  production. Render this display hyper-realistically in the production stack (real emissive
  panel, bezel reflections, glow spill onto the mat).
- Ceramic mug on an **Ember smart coaster** (matte-black disc, tiny orange charge LED) at (0.98, z −0.05), OFF the drafters mat + **Anker Soundcore headphones on a stand** on a stand at (-0.68, z 0.38), rotated 90° so the cups run along DEPTH (narrow profile), clear of the Edge.
- **Two Yamaha-class ultra-premium METAL studio monitors** (brushed-metal cabinets #3a3d44, dark baffle, signature white woofer cone, tweeter, cyan power LED), EQUIDISTANT from the laptop at x ±0.55, z −0.35, toed in ±0.25 rad. Production: model as real Yamaha HS-style monitors in metal. Camera fov is 58 so the headphone stand and both speakers read in frame.
- Hint text after 1.6s: "CLICK THE LAPTOP" (Martian Mono 11px, ls 0.35em, #8a8a92).

**Click → hand choreography** (the character from the video — realistic amigurumi/crochet look:
cream yarn #dec9a3, knit bump texture, SLIM sphere fingers — not chubby, dark knit cuff #2a2d36, and BLACK HOODIE forearms (knit-bumped #17181c tapered cylinders) running back toward the body. RIGHT arm wears the character\u2019s stacked bracelets from the video (three rings at the wrist: matte black, brushed silver, cyan). LEFT arm wears a Samsung Galaxy Watch 8: dark strap ring, gunmetal round body, near-black screen with a small green pixel — model it accurately in production):
0–22%: both hands rise into frame (left settles on the mat, right reaches to the lid edge) •
20–85%: right hand tracks the lid edge as the hinge opens to −1.85 rad; screen powers on at 30%
(B&W galaxy glow + cyan "9"), screen light ramps up • then right hand glides onto the mouse
(1.0s, ease-in-out-cubic, fingers settle) • 0.12s hold beat • 0.55s camera dive into the screen — the mouse-to-screen transition is SUPER QUICK but smooth (ease-in-out-cubic)
(lerp to (0, 0.225, −0.16), lookAt screen) → crossfade to stage 3. In production, raise the hand
fidelity toward the video character (visible stitch rows, slight fuzz/sheen) — amigurumi look is
the contract.

### 3. Windows 11 Pro screen (interactive DOM)
Full-viewport, Segoe UI. **Live wallpaper: black & white galaxy** — monochrome radial base
(#1c1f26→#0b0c10→#020204), two huge blurred white/grey nebula blobs drifting (16s/20s alternate),
tiling star field drifting diagonally (90s linear). Light mode inverts to white/grey monochrome.
- Desktop icons (top-left, Windows-style column flow): folders **Projects / Labs / Renders**
  (yellow CSS folder icons) + **SHIFT-9 Studio** app (assets/shift-9icon.png, rounded 10px, cyan
  glow shadow). Single click selects (blue highlight); double-click opens folder windows with real
  file listings (Projects = the 12 `.s9set` files with statuses; Labs = repo names; Renders = 8K
  png names). Esc or ✕ closes.
- Taskbar (48px, blurred glass): "SHIFT-9 OS · Win 11 Pro" label, centered start squares
  (#4cc2ff 2×2), search pill, small SHIFT-9 icon; right tray: **LIST/ICON VIEW toggle**,
  **LIGHT/DARK toggle**, live clock (h:mm + date, updates).
- **Clicking the SHIFT-9 icon (desktop or taskbar) → tunnel dive** (stage 4).
- "SKIP INTRO" (bottom-right, Martian Mono 10px ls 0.25em) visible through stages 1–3 → tunnel.

### 4. Tunnel dive ("through the machine")
2.6s, ease-in-out-cubic, camera z 262→50: 34 rectangular chassis bulkheads (steel #20242e, every
5th electric blue #0033FF / #2244aa) spinning slowly alternate directions, 140 additive light
streaks (#9fb6ff thin boxes 5–14 long) around the axis; fov kicks 42→72→42; ±0.05 rad barrel roll;
fog far temporarily 210. Ends exactly at CAMERA_START_Z; tunnel group disposed. Production: add
peripheral velocity blur + bloom here — this is the money shot.

### 5. The studio (main experience)
Everything in `reference/shift9-scene.js`. Key systems:
- **PROJECT REGISTRY** — single source of truth array (top of file, documented). Each project:
  `{ id: 'NN_slug', n, status, z, accent, kind, tag, spec, desc, facts[], link? }`. Adding a
  project = one object; changing status = one field. HUD, dossier, shortcut row, detail pages, and
  the reduced-motion grid all derive from it. **Preserve this property in production** (a typed
  `projects.ts`).
- **Dolly physics**: wheel → velocity (never position), damping 0.05 exponential per-frame, max
  velocity 3.0, clamped z ∈ [−250, 50], keyboard arrows, touch drag. Wheel deltaY>0 = forward.
- **Streaming**: build set when |camZ−z| < 50, destroy > 100, full dispose.
- **12 sets**: z = +20 (12 Just a Pinch) stepping −23 per set to −233 (01 WinFix); per-set looks,
  lighting rigs, idle beats and materials are all in the reference builders — port them 1:1, then
  raise fidelity (real PBR, soft shadows, bloom) without changing composition or palette.
- **Idle system**: `idleK` = settled-at-viewing-mark factor (camera at set z+13, span 16, |vel|<
  0.02). Idle overlay: dossier scrim (radial black 0.82) with Instrument Serif italic tagline +
  mono spec + "CLICK THE SET FOR THE FULL DOSSIER"; collapsible "▸ ALL SETS 01–12" row (wraps,
  max 720px, on dark panel; corner HUD dims to 0.12 while idle). Click a shortcut → `glideTo`
  (ease-in-out-cubic, dur 0.9+dist/90 capped 3.2s, cancelled by any manual input).
- **Dossier pages**: click the canvas while idle & within 26 units → full-screen static page over
  the live scene (rgba(0,0,0,0.94)): "SET NN / 12", status (LIVE #E0E0E0, else blue), Instrument
  Serif name (clamp 40–72px), italic tagline, hairline, body (mono, lh 1.85), fact grid (2px-gap
  cards #0a0a0e, 1px #1a1a20 border, 10px letterspaced labels), optional "VISIT LIVE BUILD ↗"
  (Titanium Forge → https://hidden-glow-736.higgsfield.app). ← BACK TO STAGE or Esc closes; dolly
  input frozen while open (wheel must scroll the page).
- **HUD**: top: pulsing SHIFT-9 (Instrument Serif) + "THE UNCUT SOUNDSTAGE"; bottom-left: "NN / 12",
  status, big serif project name (opacity 0.25 unless within 22 units); bottom-right: "SCROLL TO
  DOLLY" + 180px progress bar (#0033FF on #1c1c20); letterbox bars 6.5vh; film grain overlay;
  radial vignette. Fluid type per ORIGINAL_PROMPT typography constants; min UI sizes as reference.
- **Accessibility (hard gate)**: prefers-reduced-motion check BEFORE GPU init → static grid of all
  12 project cards (16:10, #0a0a0c, 1px #1a1a1e) with index/status/name; change→reduce triggers
  location.reload().
- **Tweaks** (props in the reference; make them a dev/debug panel or build flags in production):
  letterbox on/off, grain 0–0.2 (default 0.07), damping 0.01–0.3 (default 0.05), sensitivity
  0.0002–0.004 (default 0.001), fogFar 25–120 (default 55), forceStaticGrid.

## Design tokens

- Colors: #0033FF (accent blue) · #000000 (void) · #E0E0E0 (UI fg) · #FF2400 (Forge) · #FF00AA /
  #00E5FF (Arcade neon) · #35d5ee (icon cyan) · greys #555 / #8a8a92 / #1a1a20 / #0a0a0e ·
  scrims rgba(0,0,0,0.94|0.82|0.75).
- Type: Instrument Serif (display), Martian Mono (UI/body), Segoe UI (Windows screen only).
  Fluid clamps per ORIGINAL_PROMPT.md §1. Letterspacing: 0.1–0.4em on mono UI labels.
- Motion: ease-in-out-cubic everywhere (glide, tunnel, lid, hands); dolly friction is exponential
  damping, never a tween. Durations: tunnel 2.6s, lid sequence 1.7s, mouse-grab 0.4s, hold 0.12s, screen-dive 0.55s, idle fades 0.9s.

## Self-fix protocol (run on auto)

1. Scaffold Vite+TS. Port `constants.ts`, `projects.ts`, `accessibility.ts` verbatim from the
   reference/original prompt. 2. Port engine (dolly, streaming, glide, intro tunnel, idle, HUD
   events). 3. Port the 12 set builders one at a time; after each, screenshot production vs the
   reference at the same z and iterate until composition/lighting/palette match. 4. Port entrance
   (video → desk → Windows → tunnel). 5. Add WebGPU renderer + post stack (bloom, film, velocity
   blur) + WebGL fallback + mobile shader simplification (fewer lights, no shadows, half-res post).
   6. Lint, typecheck, build clean; test reduced-motion, touch, resize, Esc paths, and that wheel
   NEVER moves position directly. Fix everything yourself; escalate only vision-level conflicts.

## Known open items — assigned to Claude Code (do not silently resolve the vision; DO build these)

- **Audio is a full redo, owned by you (Claude Code).** Build a Web Audio engine and:
  - Replace the entrance video's music track (keep the video file untouched — duck/replace via a
    synced audio track layered over the muted video, or a swappable audio file the user can drop in).
  - Score + SFX for the whole experience, cinematic and restrained: laptop-lid foley + soft boot
    chime (desk scene), UI ticks/hover blips on the Windows screen, a rising whoosh + bass drop for
    the tunnel dive, low room-tone per set (kitchen hum, forge press hits + spark crackle, corridor
    steam hiss + electrical flicker buzz, arcade attract-mode chiptune bed, data-center fan wash,
    fluid-orb sub-bass swells), velocity-linked dolly wind (gain follows |vel|), and idle-dossier
    fade-in tick. Master bus with gentle compression; mute toggle in the HUD; respect autoplay
    policies (start audio on first user gesture).
- Any copy changes to the 3 fictional dossiers (Automation Sys, INSTRUMENT, Voxel Arcade BB) —
  ask the user only if a claim seems wrong.

## Files in this package

- `ORIGINAL_PROMPT.md` — founding brief (read first).
- `reference/SHIFT-9 Studio.dc.html` — UI shell: HUD, idle overlay, dossier pages, Windows 11
  screen, stage machine, tweaks (logic class at the bottom of the file).
- `reference/shift9-scene.js` — engine + PROJECT REGISTRY + all 12 set builders + tunnel + glide.
- `reference/shift9-entrance.js` — video → desk → hands → screen-dive component.
- `reference/support.js` — prototype runtime (reference-only; do not port).
- `assets/shift-9icon.png`, `assets/entrance-video.mp4`.
