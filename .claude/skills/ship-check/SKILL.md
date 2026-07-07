---
name: ship-check
description: Pre-push verification gate for the shift9 monorepo. Run before committing/pushing any change under shift9/ — builds both apps (with and without env), typechecks, and audits the diff for token, motion, a11y, mobile, and voice violations. Use for "verify", "check before push", or as the last step of any implementation task.
---

# Ship check — run before every push touching `shift9/`

Work from the workspace root: `cd shift9`. All steps must pass; report any failure
with the exact output instead of pushing.

## 1. Mechanical gates

```bash
pnpm install                          # no lockfile drift; if pnpm-lock.yaml changes unexpectedly, stop and investigate
pnpm typecheck                        # zero errors
pnpm --filter shift9-dev build
pnpm --filter just-a-pinch build
```

Then the **no-env build** (proves the static Supabase fallback):

```bash
mv apps/just-a-pinch/.env.local /tmp/ 2>/dev/null; pnpm --filter just-a-pinch build; mv /tmp/.env.local apps/just-a-pinch/ 2>/dev/null
```

Build must succeed and prerender with the static seed board. Restore the env file.

## 2. Diff audit (run on `git diff main...HEAD` scoped to your changes)

Check each; a hit is a finding to fix, or to justify explicitly in the PR body:

- **Tokens:** `grep -nE '#[0-9a-fA-F]{3,8}\b' <changed .tsx/.css files>` — raw hex
  outside `packages/theme/` is a violation. Same for raw `[0-9]+ms` durations and
  bare cubic-beziers; use theme tokens / spring tokens.
- **Motion contract:** any new `animate`, `useEffect` rAF loop, `framer-motion`
  usage, or CSS `@keyframes` must have a reduced-motion branch
  (`useReducedMotionSafe()` or `motion-safe:`) resolving to a complete static state.
- **A11y:** decorative animated nodes `aria-hidden="true"` with real text as the
  accessible name; no `outline: none` without a `:focus-visible` replacement;
  images have meaningful `alt`.
- **Mobile gating:** new `transform`/skew/proximity/magnetic effects are gated to
  desktop (min-width or `pointer: fine`); confirm what a 375px viewport renders.
- **SSR safety:** `"use client"` only where interaction requires it; no
  `window`/`document` access at module scope or during render; SSR markup equals
  the settled visual (no decode-in from empty, no CLS).
- **Voice separation:** changes in `apps/just-a-pinch` contain no `//` mono labels
  or cyber chrome; changes in `apps/shift9-dev` keep the mono/instrument voice.
- **Copy:** no marketing superlatives; plain, concrete descriptions.
- **Data:** Supabase touched only via `@shift9/data`; every consumer handles the
  `null` client; no new keys or secrets anywhere in the diff.

## 3. Runtime spot-check (when the change has a visual surface)

`pnpm --filter <app> dev`, then with Playwright (Chromium preinstalled at
`/opt/pw-browsers/chromium`) load the affected route at 1440px and 375px and with
`page.emulateMedia({ reducedMotion: 'reduce' })`. Screenshot each; confirm content
is present and legible in all three. Attach or describe the screenshots in the PR.

## 4. Report

Summarize as a checklist in the PR body: each gate, pass/fail, and how it was
verified. A skipped gate must say why. Only after this, commit and push to the
`claude/...` branch and open the PR.
