# SHIFT-9 · Monorepo

> Cyber-brutalist studio ecosystem — **one theme, three surfaces.**
> `shift9.dev` (flagship) · `just-a-pinch` (product) · GitHub profile (generated).

This is the unified codebase from the [System Architecture Blueprint](../docs/BLUEPRINT.md).
Phase 2 shipped the **foundation packages + the `shift9.dev` flagship**; Phase 3 adds
the **`just-a-pinch` product** and the **generated GitHub org profile** (`../profile/`),
with the product's recipe collection wired to **live Supabase content** and a Vercel deploy
runbook ([`DEPLOY.md`](./DEPLOY.md)).

```
shift9/
├── apps/
│   ├── shift9-dev/        # ✅ flagship studio site (Next.js 16 · App Router · Tailwind v4)
│   └── just-a-pinch/      # ✅ product landing — warm-accent surface of the same system
├── packages/
│   ├── theme/             # @shift9/theme  — design tokens (CSS vars + Tailwind v4 @theme)
│   ├── ui/                # @shift9/ui     — DitherField, WorkWall, GridFrame, MagneticButton…
│   ├── motion/            # @shift9/motion — springs, useMagnetic, useProximityWeight, a11y gate
│   └── data/              # @shift9/data   — typed Supabase client + queries (single content source)
└── (../profile = generated GitHub org page · see ./DEPLOY.md for Vercel + Supabase)
```

## The INSTRUMENT system

| Piece | Where | What |
|---|---|---|
| **Dither Field** | `ui/DitherField.tsx` | WebGL Bayer-dither shader reacting to the cursor; **palette-driven** (re-skins per surface via a `palette` prop), static CSS fallback + reduced-motion single-frame. |
| **Proximity Weight** | `motion/useProximityWeight.ts` | Variable-font `wght`/`wdth` flex toward the cursor (rAF-smoothed). |
| **Living Work Wall** | `ui/WorkWall.tsx` | Skewed, magnetic brutalist tiles. `motion-safe` only — flat for reduced motion. |
| **Magnetic UI** | `motion/useMagnetic.ts` | Spring-physics pull on primary CTAs. |
| **Grid scaffold** | `ui/GridFrame.tsx` | The signature coordinate frame + mono axis labels. |

## Design tokens (single source of truth)

`@shift9/theme` → `Void #0f172a` · `Signal #22d3ee` · `Pulse #8b5cf6`, fluid `clamp()`
type, `transition-premium` (300ms), spring tokens, high-contrast `:focus-visible`,
and a global `prefers-reduced-motion` contract. Edit a token once → every surface updates.

## Run it

```bash
pnpm install
pnpm --filter shift9-dev dev      # studio site   → http://localhost:3000
pnpm --filter just-a-pinch dev    # product site  → http://localhost:3000
pnpm --filter shift9-dev build    # production build (either app)
```

Requires Node ≥ 20 and pnpm ≥ 10. The flat `node-linker=hoisted` (`.npmrc`) keeps a
single shared React across the workspace.

## Status

- ✅ `@shift9/theme`, `@shift9/ui`, `@shift9/motion`, `@shift9/data`
- ✅ `apps/shift9-dev` — builds clean, type-checks, prerenders static
- ✅ `apps/just-a-pinch` — warm-accent landing for the recipe organizer + cooking app; **featured recipes from Supabase** (`featured_recipes`, 141 rows), static fallback, ISR hourly
- ✅ `../profile/README.md` — generated GitHub org page (branded animated SVG, themed)
- ✅ Supabase wired — existing `Just-a-Pinch` project, public read-only key, RLS-protected
- ✅ [`DEPLOY.md`](./DEPLOY.md) — turnkey Vercel runbook for both apps
- ⏳ Click-to-deploy on Vercel · merge → `main` · rename repo → `.github`
