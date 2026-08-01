# PROGRESS — `claude/flow-state-waitlist`

> State of the Flow State waitlist branch, written so a cold agent can resume without briefing.
> `CLAUDE.md` = how to work here. `docs/BLUEPRINT.md` = locked creative direction.
> `HANDOFF.md` = repo-wide continuity. **This file = this branch.**

**Last updated:** 2026-07-31
**Branch:** `claude/flow-state-waitlist`
**PR:** #39 — open, ready for review, **not merged**
**Base:** `origin/main` @ `2fa1b4b` (2026-07-29)
**Scope:** dedicated Flow State page, waitlist capture, studio link, and product-scoped waitlist uniqueness.

## Current focus

- `/flow-state` is a standalone launch page approved by Kariim: titanium/pearl on
  black, solid titanium `F`, animated waveform, simulated dictation, and no visible
  project number.
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

It replaces `/` on shift9.dev with a three-stage entrance and adds the surfaces
that entrance leads to.

| Stage | Route | What it is |
|---|---|---|
| Front door | `/` | A held plate (`00-entry-seam.jpg`) with the lockup, an **Enter the Studio** control, and a **Skip the intro** escape. |
| The film | `/` (in place) | ~20s of stitched MP4s under `public/experience/opening/`. Playable, skippable, and bypassed entirely under `prefers-reduced-motion`. |
| The desktop | `/` (after film) | A skeuomorphic OS shell: folders, an About window, a dock, an ASCII wallpaper. Folders open the roster. |
| The reel | `/studio` | `StudioDolly` — twelve projects as one continuous scroll-driven take. |
| The ask | `/start` | The invitation. Black/white wave field, one green control. |
| The gap | `/soon` | Where the six projects without their own page land. |

## The pieces that did not exist before

| File | What it does |
|---|---|
| `app/_components/StudioDolly.tsx` + `.module.css` + `studio-dolly-data.ts` | The twelve-project reel. Every entry now carries an `href`. |
| `app/_components/WaveField.tsx` | Canvas wave field behind `/start`. One path, one `stroke()` per frame; quality steps down under load; pointer push gated to `(pointer: fine)`; pauses on `visibilitychange`. |
| `app/_components/Shift9Mark.tsx` | The mark — the 9 from the org icon, cut down the middle, right half dropped 6 units and carrying opacity. One `currentColor`, no variants. |
| `app/_components/AsciiWallpaper.tsx` + `AsciiTunnel.tsx` + `ascii-art-data.ts` | The desktop wallpaper and the between-surface tunnel. |
| `app/start/` , `app/soon/` | The two new routes. |
| `packages/theme/pearl.css` | `.s9-pearl` (verdant on black) and `.s9-pearl-dark` (black on white). Four-shadow lighting, bloom, sheen, hover lift, press, reduced-motion branch, full width under 34rem. |
| `scripts/build-ascii-art.py` | Generates `ascii-art-data.ts`. Do not hand-edit the output. |

## Tokens added (all in `packages/theme/tokens.css`)

`--s9-obsidian #000000` · `--s9-chalk #ffffff` · `--s9-verdant #00e676` ·
`--s9-verdant-lift #5cffa8` · `--s9-ink-2` · `--s9-pulse-ink` · `--s9-font-text` ·
`--s9-dur-tunnel`.

Three existing tokens were re-pointed: `--s9-ink-dim` (`#64748b` → `#94a3b8`, which
was 3.75:1 on Void and is now 6.96:1), `--s9-ink`, and `--s9-font-display`
(Anybody → Bricolage Grotesque). **Just a Pinch is unaffected** — it overrides all
three unlayered in its own `globals.css` (lines 21, 22, 31).

## The scale trap — read before touching `globals.css`

`shift9-dev/app/globals.css` ramps the root font size above 80rem:

```css
@media (min-width: 80rem) {
  :root { font-size: clamp(0.85rem, min(100vw / 90, 100vh / 35), 3.4rem); }
}
```

So `rem` **is not 16px** in that file. Inside the media *query* `rem` resolves against
the initial 16px; inside a *declaration* it resolves against the actual root size.
A change made on the assumption that `1rem === 16px` will move the layout the wrong
way. The layout holds its proportions from 1280 to 2736 (measured: the `/start`
column is 3.78% of width and 40% of height at both ends). Above ~2736 the clamp caps
and the composition starts to thin.

---

## Verified on 2026-07-27, against this exact HEAD

| Check | Result |
|---|---|
| `pnpm --filter shift9-dev build` | exit 0 — 17 static pages |
| `pnpm --filter just-a-pinch build` | exit 0 — 4 pages |
| `turbo run typecheck --force` | exit 0, both apps, cache bypassed |
| Both apps build with **no** `.env` present | confirmed — no `.env` exists in either app or at the workspace root |
| Dry-run merge into `origin/main` | `git merge --no-commit --no-ff` → exit 0, **zero conflicts** |
| Render at 1280 / 768 / 390 | `/`, `/studio`, `/start`, `/soon`, `/instrument`, `/work/[slug]` all HTTP 200, zero uncaught page errors, `scrollWidth === clientWidth` at every width (no horizontal overflow) |
| Reduced motion | `/`, `/start`, `/soon` all render complete legible content. `/` skips the film and lands on the desktop — a finished state, not a paused one. |

## Fixed on Kariim's go-ahead, 2026-07-27 (commit `6c176e2`)

- **Favicons, both apps.** `/favicon.ico` (16/32/48/64), `/icon.svg` and
  `/apple-icon.png` (180, full-bleed — iOS applies its own mask and a pre-rounded
  tile double-rounds). Generated by `shift9/scripts/build-icons.py`; the outputs
  are owned by the script, do not hand-edit them. The studio uses the mark from
  `Shift9Mark.tsx` at gap 9 / shift 7 rather than the header's 3 / 6, because at
  16px the header cut lands at 0.24px and the mark reads as a plain 9 — and past
  ~10 units the cut separates the counter from the tail and it stops being a
  numeral at all. Pinch gets a **P** (Gloock, OFL 1.1, baked in as a path so
  nothing depends on the font file); a pinch of grains was drawn first and read
  as a question mark at 16px.
- **The dead `/#work` anchor.** Both usages in `app/work/[slug]/page.tsx` now
  point at `/studio`. No fragment: the dolly maps scroll position to frame, so an
  anchor jump would land mid-take with no context.
- **The desktop clock is live** (`Clock` in `EnterTheStudio.tsx`). Seeded in the
  state initialiser so the server renders a real time rather than a blank that
  pops in, `suppressHydrationWarning` for the round-trip disagreement inherent to
  a clock, re-read on mount, ticking on the minute boundary. `.clock` reserves
  its width in tabular figures so it cannot shift the taskbar. Verified: zero
  hydration warnings on every route at all three widths.

## Known, NOT introduced by this branch, and deliberately left

- **`pnpm lint` is broken repo-wide.** The script is `next lint`, which Next 16
  removed; it now reads `lint` as a directory and exits 1. There is no
  `eslint.config.*` or `.eslintrc*` anywhere in the repo. Byte-identical on
  `origin/main`, so lint has not run since the Next 16 upgrade.
- **`// project file — 01` renders as `// // PROJECT FILE — 01`.** `MonoLabel`
  already emits its own `//` marker and the string passed in at
  `app/work/[slug]/page.tsx:66` carries a second one.
- **Every `/work/[slug]` hero video is hot-linked to Higgsfield's CloudFront**
  (`lib/work-data.ts`, ten URLs). No local copy in `public/`, no `poster` fallback —
  if those objects expire the pages show an empty rectangle.

## Not built — offered this session, never accepted or declined

- A denser ASCII banner.
- A real ticking countdown on the film (the current one is a static `20s`).
- Carrying the mark into the favicon and the GitHub org avatar.

---

## Rules that bite on this branch specifically

- Tokens only — the diff was checked for raw hex and raw `ms`; keep it that way.
- Every animation branches on `useReducedMotionSafe()` to a **complete** static state.
- Skew / proximity / 3D effects stay behind `(pointer: fine)` or a min-width gate.
- `ascii-art-data.ts` is generated. Change `scripts/build-ascii-art.py` and rerun.
- Never push to `main`; never self-merge. PR #35 is Kariim's call.
