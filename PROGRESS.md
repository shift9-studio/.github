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

# Prior state — `claude/flow-state-confirmation-email`  (merged, PR #42)

**Last updated:** 2026-08-02
**Branch:** `claude/flow-state-confirmation-email`
**PR:** #42 — ready, green, awaiting Kariim's merge approval
**Base:** `origin/main` @ `92b74d3` (PR #41 merged)
**Scope:** send one confirmation after Flow State waitlist acceptance and document the private owner workflow.

## Current focus

- `/api/waitlist` still writes through the insert-only Supabase client first.
  Accepted and duplicate-masked requests then call Resend; a mail failure never
  discards the saved place.
- `confirmation-email.ts` uses the native HTTPS API with a five-second abort,
  no SDK dependency, a deterministic SHA-256 idempotency key, and a server-only
  `RESEND_API_KEY`. The sender is `Flow State <updates@shift9.dev>` and replies go
  to `shift9dev@gmail.com`.
- The form now distinguishes `confirmation: sent` from `unavailable`. The latter
  says the place is saved instead of falsely promising inbox delivery.
- The existing Resend account already had `shift9.dev` verified. A separate
  `Flow State confirmation` key was created with sending-only access restricted
  to that domain and stored as a sensitive Vercel variable for Preview and
  Production. The existing `Supabase Auth SMTP` key was untouched.
- Owner workflow: Supabase Table Editor → `waitlist` → filter `source` to
  `flow-state`; Resend → Emails shows delivery and bounce status.

## Verification

- `test:flow-state` passes. Bite proof: replacing the sender call with a hardcoded
  success failed red at `Confirmation must run only after the waitlist accepts
  the address`; restoring it passed green.
- `pnpm --filter shift9-dev typecheck`, the full Shift-9 production build, and
  the Just-a-Pinch production build pass with no Resend key in the checkout.
- The configured local endpoint returned
  `200 {"ok":true,"confirmation":"unavailable"}`, proving a missing sender does
  not erase the accepted waitlist state or claim an email was delivered.
- The protected Vercel preview returned
  `200 {"ok":true,"confirmation":"sent"}` for `shift9dev@gmail.com`. Resend's
  Emails dashboard recorded the matching subject as `delivered` immediately.
- The protected `/flow-state` preview renders the finished signup surface. The
  browser driver's semantic submit click timed out before dispatch, so the API,
  provider delivery record, and pure response-state test are the interaction
  evidence; do not claim a browser click completed.

## Remaining gate

- Kariim's explicit approval to merge green PR #42. Nothing is live until that
  merge.

## Provider gotcha

- Vercel CLI advertised a free Resend marketplace plan, but provisioning exposed
  only paid Pro/Scale resources after terms acceptance. Do not select a paid plan.
  The correct no-monthly-bill path is the existing direct Resend account.

---

# Prior state — `codex/instrument-case-study`

> State of the Instrument redesign branch, written so a cold agent can resume without briefing.
> `CLAUDE.md` = how to work here. `docs/BLUEPRINT.md` = locked creative direction.
> `HANDOFF.md` = repo-wide continuity. **This file = this branch.**

**Last updated:** 2026-08-01
**Branch:** `codex/instrument-case-study`
**PR:** #40 — merge authorized by Kariim on 2026-08-01; merge after final green checks
**Base:** `origin/main` @ `62bdea5` (Flow State merged)
**Scope:** give Flow State its water-surface direction; make `/instrument` a public lab case study with an easy project-extension path; preserve its technical catalog and distinguish it from Titanium Forge.

## Current focus

- `/flow-state` now uses a full-page, pointer-reactive black-water canvas with
  subtle refracted pearl/warm light, a black diamond jewel `F` header mark, and
  the existing logo/waveform/text demo shaped into the same pill language.
- `/instrument` is its own lab room: the actual Instrument set-piece sits on an
  open bench with a pointer inspection light and one slow scanner pass. The hero
  copy is borderless so it does not block the light, and the image masks smoothly
  into the next section instead of ending on a hard line.
- The live site is the visual source; earlier docs are context only. The
  invitation page is not a template and its closing WaveField is not used here.
- Instrument specimens and surface-voice rows come from
  `app/instrument/instrument-projects.ts`. A new project page needs one registry
  entry (name, route, image, copy); the page JSX and CSS do not change.
- The dense token, type, motion, component, and hook catalog moved intact to
  `/instrument/reference`. Its stale room count, `/start` accent description,
  missing Flow State and Instrument rooms, and missing product materials were corrected.
- `/instrument/reference` now opens with a living archive of all twelve current
  projects, sourced directly from the Studio reel registry. A sticky numbered
  index, asymmetric feature frames, project imagery, status, stack, and actions
  keep the page useful as the catalog grows.
- Both studio catalogs now identify Instrument as Shift-9's production system
  and Titanium Forge as the portable component workbench.
- All Instrument return and action controls use the pearl button family.
- The floating return control on `/start`, `/flow-state`, and `/instrument` now
  uses one shared compact ghost-pearl modifier. Instrument page actions are
  slimmer and capped on mobile instead of filling the viewport by default.
- The landing gate is back to the original static yarn photograph. There are no
  split layers, displacement shader, or curtain-motion states; Enter hands
  directly to the preloaded film. The visible `20s` remains removed, and the
  split 9 mark keeps its restrained opposing hover.
- Studio set-piece clips no longer use native hard loops. Two cached video layers
  crossfade before the decoded end, pause offscreen, and clean up rAF/timers.
- The studio outro is a physical invitation card with a secondary backing card,
  private-viewing line, S9 seal, and the existing Shift-9 artwork/settle film.
- The Studio reel no longer enters through a basic centered title card. Its new
  asymmetric threshold uses a twelve-stop dolly track and a seamless alternating
  survey motion sourced from the same canonical roster.
- Alternating light project rows now pin their headings and links to the dark
  ink token instead of inheriting the low-contrast title color. The production
  preview confirms all four Apps titles remain readable on both row materials.
- Intro and reel media promises are cancellation-safe after teardown, and the
  intro runtime watchdog now starts on actual playback rather than on mount.
- Public contact links now consistently use `shift9dev@gmail.com`.
- Public copy on both pages was audited for clients and partners. Guards reject
  prototype, draft, TODO, review-note, stale bench-note, and test-suite language.
- `test:instrument` guards the route split, registry path, product distinction,
  current reference, lab motion, reduced-motion branch, set-piece media, and listing copy.
- `test:studio-polish` guards seamless media, the invitation object, split-9
  hover, the static yarn entrance, ghost controls, reduced motion, and public note cleanup.

## Verification

- Contract green. Changing the Titanium Forge distinction made it fail red with
  `Instrument must distinguish itself from Titanium Forge`; restoring it passed.
- `pnpm typecheck`, `pnpm --filter shift9-dev build`, and
  `pnpm --filter just-a-pinch build` all exit 0. Both Instrument routes prerender.
- Production preview: `/flow-state`, `/instrument`, and `/instrument/reference`
  render with no horizontal overflow. Flow State and Instrument were checked at
  1280px and 390px; their public DOM contains none of the forbidden internal copy.
- `/`, `/start`, and `/studio` were visually checked in the rebuilt production
  preview. The visible `20s` and all rendered `prototype note` strings are absent.
- The rebuilt Apps folder was checked in-browser: light rows use dark project
  titles and body copy; the full Shift-9 production build exits 0.
- Every public route was reviewed at desktop scale. The archive and Studio
  threshold were additionally checked at 390px; all twelve archive links and
  project titles are present in the public DOM, with no horizontal overflow.
- The rebuilt entrance shows the original static yarn plate and contains no
  curtain split, WebGPU renderer, or curtain-motion state.
- The project archive inspection motion is now a tapered optical wash with a
  slight image lift, not a bright one-pixel laser line; hover and focus trigger
  one restrained pass and reduced motion keeps it still.

## Merge authorization

- Kariim explicitly authorized landing PR #40 on `main` on 2026-08-01 after
  rewinding the yarn entrance to its static version.

## Machine gotcha

- `next dev` can exceed the Windows path limit for `/instrument/reference` in this
  long generated worktree path. The optimized build and `next start` both work;
  use the production preview here or a shorter checkout for development mode.

---

## Prior Flow State branch state

> State of the Flow State waitlist branch, written so a cold agent can resume without briefing.
> `CLAUDE.md` = how to work here. `docs/BLUEPRINT.md` = locked creative direction.
> `HANDOFF.md` = repo-wide continuity. **This file = this branch.**

**Last updated:** 2026-08-01
**Branch:** `claude/flow-state-waitlist`
**PR:** #39 — merged to `main` on 2026-08-01 after Kariim's authorization
**Base:** `origin/main` @ `2fa1b4b` (2026-07-29)
**Scope:** dedicated Flow State page, waitlist capture, studio link, and product-scoped waitlist uniqueness.

## Current focus

- `/flow-state` is a standalone launch page approved by Kariim: titanium/pearl on
  black, a solid warm-spectrum holofoil `F`, animated waveform, simulated
  dictation, and no visible project number. The headline remains titanium.
- The Flow State card in `/studio` now links directly to `/flow-state`.
- The waitlist posts through `/api/waitlist` with email validation, a honeypot,
  best-effort per-instance limiting, generic duplicate responses, and source
  `flow-state`.
- Supabase migration `20260731_waitlist_email_source_uniqueness.sql` was applied
  to production. Uniqueness is now `(lower(email), source)`, `source` is required,
  `waitlist_source_nonempty` rejects blank tags, and the existing insert-only RLS
  policy is unchanged.
- A rollback-only production test proved one address can join `pinch-landing` and
  `flow-state`, while a second `flow-state` insert is rejected. The database still
  contains only the one pre-existing `mcp-verify` row.
- Vercel project `shift-9/shift9-dev` now has the checked-in public Supabase URL
  and publishable anon key configured as encrypted Production and Preview variables.

## Verification

- `pnpm --filter shift9-dev test:flow-state` passes. Its migration assertion was
  mutation-tested: `source_typo` failed red, restored `source` passed green.
- Final checks on 2026-07-31: `pnpm typecheck`,
  `pnpm --filter shift9-dev build`, and
  `pnpm --filter just-a-pinch build` all exited 0.
- The page was visually checked at desktop and 390px mobile with no overlap or
  horizontal overflow; reduced motion has a complete static state.
- The protected branch preview returned 200 for `/flow-state`. Two real
  `/api/waitlist` submissions returned `{"ok":true}`; Supabase contained exactly
  one `flow-state` row, proving duplicate masking and persistence. The synthetic
  `.invalid` row was then deleted and a zero-row query confirmed cleanup.
- Holofoil refinement on 2026-08-01: desktop and 390px mobile render the tokenized
  coral/gold/pearl/jade/rose material with no overflow. Waveform, typed simulation,
  invalid-email feedback, and the safe no-env state work. Reverting the F to
  titanium fails the contract; restoring holofoil passes. Full typecheck and both
  production builds exit 0; independent review has no findings.
- Updated protected preview: `/flow-state` returned 200; first and duplicate
  waitlist submissions both returned 200; Supabase stored exactly one
  `flow-state` row. The synthetic row was deleted and a zero-row query confirmed
  cleanup before merge.

## Known follow-up

- The route limiter is process-local. Deployment-wide rate limiting needs a
  shared store, Vercel firewall rule, or verified challenge. The honeypot remains
  the low-cost protection in this branch.
- Do not copy a sensitive Vercel variable by running `vercel env pull`: Vercel
  exports an 11-character placeholder, not the value. That caused a preview 500
  (`Invalid supabaseUrl`) during this session. Restore these public client values
  from the checked-in `.env.example`, then redeploy and test the real endpoint.

---

## Prior entry-experience branch context

The remaining notes below describe the earlier entry-experience branch and are
kept as historical design context; they are not the current branch state.

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
| The enlarged monitor fits | Glass flooded and its bounding box measured against the viewport at **nine real browser viewport sizes** (1080p/1440p maximised, MacBook 13/14/16 maximised, ultrawide, small window). Clear on all four edges at every one; tightest 1920×937 with 4px to spare. Only a 2.65:1 ultrawide crops the panel's top, which the plate does at any size |
| The forearm leaves frame | Open end off-screen at 1280×800, 1440×900, 1920×1080, 2560×1440 and 2560×1280 (2:1, the widest admitted) |
| Keyboard | 22 of 24 tab stops land inside the composited screen; the full-size hotspot is in the tab order and works |
| `prefers-reduced-motion` | Room renders, complete and legible, film skipped. Frame **pixel-identical across 1.2s** at 1280 and 390 — nothing is animating |
| WebGL disabled (actually, via `--disable-webgl`) | Falls back to today's full-bleed desktop. 5 tiles, 0 errors |
| The 8.45s stop | Three runs: stopped at **8.495 / 8.466 / 8.464s**, furthest the film played **8.475 / 8.463 / 8.442s** (the hand enters at 8.500). Plate decoded and covering in all three — which is the point of the design: the stop is never exact, the still is |
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
- **The panel resizes to the window; there is no aspect gate.** For one commit
  there was one — 8:5 to 2:1 — and it was a shipped bug: a maximised browser on
  a 1080p display has a viewport near 1920x937, aspect **2.05**, which fell
  outside it. The most common desktop setup there is silently got no room at all
  and the whole feature was invisible to the person who asked for it. Caught only
  because Kariim said "that preview is the current site".
  `screenScale(aspect)` in `scene.ts` now makes the panel as large as the current
  window can hold, clamped to [1, 1.52]. Every window that can show a room gets
  one, sized to itself — verified at nine real browser viewport sizes, not at
  monitor resolutions, because the media query sees the viewport.
  **The lesson, since this file exists to stop the next agent repeating it:** a
  gate is the wrong tool for "this might not fit". Resize the thing.
- **Above ~2.06:1 the top of the film's monitor is cropped**, at *any* panel
  size, the photographed 34" one included — the plate has 70px of wall above it
  and the frame does not contain more. The room still renders there; cropping the
  top of a monitor is a far smaller loss than deleting the room.
- **The push-in is gone.** `COMPOSITION` is the whole plate, so `FRAMING_ZOOM`
  is exactly 1. It existed to make the desktop readable while the monitor was
  stuck at the photograph's size; the bigger panel supplies that for free, and
  the crop was magnifying a 1928px still and softening the room to buy it. The
  machinery is intact and measured — narrow the rect again if the room ever needs
  to push in for a different reason.
- **The hand is revision 4, and its run-card records all 17 passes.** It now
  HOLDS the mouse rather than resting near it — a palm grip taken off ergonomics
  references, since the film only ever shows the hand from one angle: index and
  middle onto the buttons, ring and pinky turning down the right flank, thumb
  gripping the left. Also 18% larger and a lighter ochre, both on Kariim's call,
  and a row-biased stitch field so the crochet reads as courses rather than as
  quilting.
- **The wrist bend is in the model, and it is 50° where a human does 30.** The
  one deliberately non-anatomical number, and load-bearing: with the forearm on
  the hand's own axis the sleeve sits directly between the camera and the palm,
  and three passes tried to fix that by rotating the whole prop — each one
  buying a visible palm by turning the hand off the mouse. With the bend in the
  model the prop's rotation drops from 1.45 to 0.62 and the hand points down the
  mouse it is holding.
- **The curl window is narrower than it looks.** Pushed to make the hand grip,
  the digits came round far enough to meet their own knuckles and rendered as
  two fat hooks with no palm. A finger on a mouse drops about a third of its own
  length, no more — and the digits had to slim from 17.6mm to 13.6mm across or
  they merged into one lobe at the size the prop actually covers.
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
