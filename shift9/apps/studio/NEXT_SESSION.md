# Warm start — read this first in every new session

You are continuing the shift9.dev/studio rebuild ("The Uncut Soundstage").
Phase 1 is DONE (user-approved). Phase 2 (engine core) is DONE — pushed on
PR #30 with 11/11 physics checks; the user reviewed the evidence and directed
Phase 3 prep (if they raise anything about the engine feel, fix it before set
work). The user judges every phase; you never self-certify. Read these, in
order, before writing any code:

1. `/BUILD_CONTRACT.md` (repo root) — the binding rules, the 8 phases, the
   judging protocol, and the highest-quality-assets clause. It is law.
2. `handoff/README.md` — the design handoff (behavioral spec + approved deviations).
3. `handoff/ORIGINAL_PROMPT.md` — founding brief (wins conflicts not covered by
   approved deviations).
4. `handoff/reference/` — the working previz prototype. Pixel-fidelity target.
5. `RESEARCH.md` — live-site content inventory + award-site technique table.

## State after Phase 2 (branch claude/studio-rebuild-phase-2-y4ew51)

- Phase 1 baseline as before: scaffold, verbatim `constants.ts` /
  `accessibility.ts` / `projects.ts` (do not touch without a recorded user
  decision), reduced-motion hard gate, `compare/ref/ref-z*.png` baseline.
- Phase 1 gap repaired: `apps/studio/package.json` restored (the root
  `.gitignore` used to swallow every `package.json`; rule now scoped to `/`).
- `src/engine/experience.ts` — REAL engine, ported 1:1 from the reference:
  wheel → velocity (never position), damping `pow(1-0.05, dt*60)`, max vel 3.0,
  z clamp [-250, 50], keyboard + touch, streaming (build < 50 / destroy > 100 /
  full dispose), glideTo (capped 3.2s, cancelled by input), handheld drift,
  tunnel intro (34 bulkheads + 140 streaks, fov kick, barrel roll), emitHud →
  `shift9-hud`/`shift9-open`/`shift9-ready`/`shift9-entered` CustomEvents,
  idleK, setLocked. Stagecraft helpers (glow/softbox/dustPlane/lightCone) +
  shaders ported, ready for the set builders.
- `src/engine/sets/index.ts` — empty SET_BUILDERS registry: Phases 3-4 add one
  builder per `kind` here (until then streaming builds only the shared floor).
- `src/ui/hud.ts` — HUD chrome consuming the events (letterbox, grain, vignette,
  brand row, index/status/name with 22-unit dimming, progress bar). Idle
  overlay + dossier pages deliberately deferred to Phase 6; HUD idle-dimming
  (0.12) goes in with them.
- Harness hooks in production: `window.__S9_SET_Z(z)`, `__S9_GLIDE(z)`,
  `__S9_STATE()`; `?skip-intro` query param jumps the tunnel.
- `harness/verify-physics.mjs` — 11 headless assertions of the physics
  contract, all passing (report: `compare/phase2/physics-report.json`).
  `harness/shoot-phase2.mjs` — stills at all 12 ref z + tunnel + reduced +
  video recording. Evidence committed under `compare/phase2/`.

## Phase plan (next up: PHASE 3 — read this whole section, the process changed)

**User directive (2026-07-21, binding — BUILD_CONTRACT clause 9): the twelve
sets are built ONE PER FRESH SESSION**, to prevent drift. Phase 3 = sets
12→07, phase 4 = sets 06→01, then ONE consolidation session before Phase 5.

### The per-set session script (follow exactly)

1. Warm-start (docs above) and get on the right branch (see "Branch dance").
2. Say hello in PLAIN language: name the set this session builds and ask the
   user for their reference images for it. **STOP AND WAIT. Do not build any
   visuals before their images arrive** (uploads land under
   `/root/.claude/uploads/`; they may also paste into chat).
3. Build the set in `src/engine/sets/<kind>.ts`, registered in
   `sets/index.ts`. Start from the reference builder in
   `handoff/reference/shift9-scene.js` (composition/z/palette contract), then
   raise fidelity to the user's images: hyper-real, AAA — real PBR materials,
   textures, soft shadows, believable lighting. Contract clause 8: no
   placeholders, no "good enough".
4. Verify yourself first: `pnpm build` clean; screenshot at the set's z
   (harness `shoot-phase2.mjs` pattern, `__S9_SET_Z`); compare against BOTH
   `compare/ref/ref-z*.png` (composition) and the user's images (look).
   Iterate until you can't tell them apart.
5. Deliver in chat: stills + a short video of dollying through the set.
   Plain words only. THE USER VERIFIES VISUALLY — the set is done only on
   their explicit pass; "fix X" reopens it, fix until pass.
6. On pass: commit set + evidence under `compare/phase3/<set>/`, push, update
   the scoreboard below and this file's state notes, keep the PR updated.

### Final refinement path — APPLY AS THE FIRST PASS on every remaining set

Set 12 reached its final look through ~8 refinement rounds. **Do not repeat the
rounds — start the next set already at that bar.** `sets/kitchen.ts` is the
worked reference; mirror its structure. The path, in order:

**A. Inherit the engine — do NOT rebuild these (they're global, every set gets them free):**
- Cinema stack in `experience.ts`: `EffectComposer` = N8AO (ambient occlusion,
  renders the scene; replaces RenderPass) → `UnrealBloomPass(0.2, 0.4, 1.05)` →
  `OutputPass` → `GradeShader` (film grade matched to the reference plates).
- `softbox()` emits a real `RectAreaLight` key + a PCF-soft shadow-casting spot.
- `stageEnv(renderer)` (`engine/environment.ts`) = black-soundstage IBL for all
  reflective/satin PBR surfaces.
- Dust is fixed engine-wide (fine, drifting, twinkling) in `shaders.ts DUST_FRAG`.
- Helpers on the engine: `glow`, `dustPlane`, `lightCone`, `contactShadow`/
  `aoStrip` (in kitchen.ts, promote if reused), `RoundedBoxGeometry`.

**B. Build the set at final quality first-pass (kitchen.ts is the template):**
1. Blockout from `handoff/reference/shift9-scene.js` builder — keep its
   envelope, z, palette, copy strings. That's the composition contract.
2. Materials: `MeshPhysicalMaterial`, never bare Standard for hero surfaces.
   Give each a `roughnessMap`+`bumpMap` from `noiseTex()` (orange-peel micro-
   relief), `clearcoat` on anything painted/lacquered, `envMap: stageEnv(...)`,
   `envMapIntensity` tuned (matte 0.2–0.5, metal 0.9–1.3). Procedural stone via
   the domain-warped `counterTex()` marble pattern; `concreteTex()` for floors.
3. Geometry: `RoundedBoxGeometry` for ALL joinery (bevels catch light — the
   #1 "not a game" tell). Mechanical parts = swept `TubeGeometry` along a
   `CatmullRomCurve3`, never stacked primitives. Props = `LatheGeometry`
   silhouettes. Real glass = `MeshPhysicalMaterial{transmission:1, ior:1.5,
   thickness, attenuationColor}`.
4. Lighting = formal 3-point matched to THAT set's reference mood: key =
   `softbox()`; fill front-offset at ~¼ key (cool for clinical sets, warm for
   moody); white rim behind for void separation. **Wash lights go HIGH and
   BACK so their falloff pools land above frame** — a point light near a wall
   makes a blown-out hotspot (learned the hard way). Interior back panels
   fully MATTE (roughness ~0.9, no envMap) or they catch the key as a glow blob.
5. `castShadow`/`receiveShadow` on every hero mesh; keep `contactShadow` bakes
   light (~0.45) UNDER the real shadows. Volumetric key haze = soft
   `ConeGeometry` shader at very low opacity (~0.006–0.01).

**C. Verify (3d-master-modeler Phase 5 loop):** `pnpm build` clean → shoot at
the set's z (mark/near/wide) → **READ the PNGs yourself** → fix hotspots /
blown-out / muddy / floating artifacts → re-render. Then record the dolly video.

**D. Deliver VIDEO ONLY to the user** (their standing preference), plain words,
then wait for their explicit pass. "Fix X" → fix until pass.

**Banned / known walls (don't rediscover):** GTAO pass (blacks out whole
surfaces on the sandbox GL) — N8AO only. Poly Haven / ambientCG direct
download = egress 403 — use procedural, or textures the user uploads / a public
GitHub repo you clone. A skill the user names that isn't loaded lives in the
public `Kariimc/my-skills` repo (`skills/<name>/SKILL.md`) — clone + follow it;
`3d-master-modeler` is the 3D build method.

### Set scoreboard (update every session)

| Set | Kind | z | Session status |
|---|---|---|---|
| 12 Just a Pinch | kitchen | 20 | DONE — full cinema-stack build, real tap/sink/glass, fitted cabinetry, fixed dust; user banked it |
| 11 Flow State | fluid | -3 | NEXT — apply the refinement path above first-pass |
| 10 Learning App | floatcube | -26 | not started |
| 09 Lumen Mapper | lumen | -49 | not started |
| 08 Voxel Arcade BB | arcade | -72 | not started |
| 07 Midnight Return | corridor | -95 | not started |
| 06 Game Design Forge | workbench | -118 | not started (phase 4) |
| 05 Titanium Forge | forge | -141 | not started (phase 4) |
| 04 INSTRUMENT | synth | -164 | not started (phase 4) |
| 03 Automation Sys | datacenter | -187 | not started (phase 4) |
| 02 Omni-3D | warehouse | -210 | not started (phase 4) |
| 01 WinFix | whiteroom | -233 | not started (phase 4) |

After all 12 pass: consolidation session — full run-through on one branch,
every set re-verified at its z, full-length video to the user, their pass
gates Phase 5.

### Branch dance (each fresh session gets its own claude/... branch)

The platform assigns each session a new designated branch that starts from
`main`. The studio work lives on the PREVIOUS session's branch. First moves
(this is exactly what the Phase 2 session did):

```
git fetch origin
git checkout -B <your-designated-branch> origin/<latest-studio-branch>
```

Latest studio branch right now: `claude/start-set-12-kgtbwi`
(PR #31 — supersedes #30; the studio PRs accumulate, never merge them yourself).
ENGINE NOTE (binding): the full cinema stack + refinement path is now baked in
and documented above ("Final refinement path"). Read that section, then build
the next set at that bar on the first pass. Push to YOUR designated branch only;
open a PR for it if none exists, note it supersedes the previous one, and update
this "latest" pointer + the scoreboard every session.

## How to verify (the harness)

`harness/shoot.mjs` — drives the REFERENCE prototype headless and screenshots at
given z values. `harness/shoot-app.mjs` — screenshots the production build
(normal + reduced-motion). Setup in a fresh session:

```
cd <scratchpad>/harness && npm init -y && npm i playwright-core three@0.160.0 react@18.3.1 react-dom@18.3.1 @babel/standalone@7.29.0
cp <repo>/shift9/apps/studio/harness/*.mjs .
# serve the reference:  (cd <repo>/shift9/apps/studio/handoff/reference && python3 -m http.server 8801)
# serve the app:        (cd <repo>/shift9/apps/studio && pnpm exec vite preview --port 8802)
SKIP_INTRO=1 node shoot.mjs "http://127.0.0.1:8801/SHIFT-9%20Studio.dc.html" shots/ref "20,-3,-26"
node shoot-app.mjs
```

Chromium lives at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (SwiftShader
flags already in the scripts). The scripts intercept the reference's unpkg CDN
imports and serve them from local node_modules (egress blocks unpkg).
Playwright can also RECORD VIDEO (`browser.newContext({ recordVideo: {...} })`) —
phase gates require screen recordings sent to the user in chat, not just stills.

## Per-phase gate ritual (do all of it, every phase)

1. Build the phase. 2. Screenshot production vs reference at the same z for every
   affected set; iterate until they match. 3. Record video of the running build.
4. Commit evidence under `compare/`, push, keep the current studio PR (#30 as of phase 2) updated.
5. Redeploy the user's test link (Vercel MCP `deploy_to_vercel`, project
   `shift9-studio-soundstage`, team `shift-9`, target `preview` — upload the app
   SOURCE files inline; Vercel builds them. The 14 MB entrance video is too big
   for inline upload — excluded until Phase 5; solve hosting then, e.g. by
   connecting the git repo to the Vercel project in a user-approved step).
6. Send videos + stills + link in chat. 7. Wait for the user's PASS before the
   next phase. "Fix X" → fix until pass.

## User communication rules (learned this session, binding)

- Plain language, zero jargon. The user builds nothing and runs nothing —
  never hand them a command or a manual step.
- The user is the sole judge of done. Evidence goes to them in chat every phase.
- Highest-quality assets only; no substitutions, no shortcuts, ever. The 3D
  space must look exactly like the reference images.
- Tool-permission pop-ups: explain in one plain sentence what a pop-up will do
  BEFORE triggering it (the user has declined tools they didn't understand).
- Watch the current studio PR via the subscription; Vercel bot comments about shift9-dev /
  just-a-pinch previews are noise unless they fail.
