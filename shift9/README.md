# SHIFT-9 · Monorepo

> Cyber-brutalist studio ecosystem — **one theme, three surfaces.**
> `shift9.dev` (flagship) · `just-a-pinch` (product) · GitHub profile (generated).

This is the unified codebase from the [System Architecture Blueprint](../docs/BLUEPRINT.md).
Phase 2 ships the **foundation packages + the `shift9.dev` flagship**.

```
shift9/
├── apps/
│   └── shift9-dev/        # ✅ flagship studio site (Next.js 16 · App Router · Tailwind v4)
├── packages/
│   ├── theme/             # @shift9/theme  — design tokens (CSS vars + Tailwind v4 @theme)
│   ├── ui/                # @shift9/ui     — DitherField, WorkWall, GridFrame, MagneticButton…
│   └── motion/            # @shift9/motion — springs, useMagnetic, useProximityWeight, a11y gate
└── (just-a-pinch + github-profile land in Phase 3)
```

## The INSTRUMENT system

| Piece | Where | What |
|---|---|---|
| **Dither Field** | `ui/DitherField.tsx` | WebGL Bayer-dither shader reacting to the cursor; static CSS fallback + reduced-motion single-frame. |
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
pnpm --filter shift9-dev dev     # http://localhost:3000
pnpm --filter shift9-dev build   # production build
```

Requires Node ≥ 20 and pnpm ≥ 10. The flat `node-linker=hoisted` (`.npmrc`) keeps a
single shared React across the workspace.

## Status

- ✅ `@shift9/theme`, `@shift9/ui`, `@shift9/motion`
- ✅ `apps/shift9-dev` — builds clean, type-checks, prerenders static
- ⏳ Phase 3 — `just-a-pinch`, generated GitHub profile, Supabase wiring, deploy
