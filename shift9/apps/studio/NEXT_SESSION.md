# Warm start — read this first in every new session

You are continuing the shift9.dev/studio rebuild ("The Uncut Soundstage").
Phase 1 of 8 is DONE and user-approved; Phase 2 (engine core) is BUILT and
awaiting the user's judgment. The user judges every phase; you never
self-certify. Read these, in order, before writing any code:

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

## Phase plan (next up: PHASE 3, after the user passes Phase 2)

Phase 3 = sets 12–07 ported 1:1 from the reference builders (kitchen,
fluid, floatcube, lumen, arcade, corridor) into `src/engine/sets/`, one file
per kind, each verified screenshot-vs-reference at its set z against
`compare/ref/`. Then phases 4-8 per the contract table.

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
4. Commit evidence under `compare/`, push, keep PR #29 updated.
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
- Watch PR #29 via the subscription; Vercel bot comments about shift9-dev /
  just-a-pinch previews are noise unless they fail.
