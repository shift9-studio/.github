# Deploying SHIFT-9 — Vercel + Supabase

Two Next.js apps from one monorepo, plus the live content source. This is the
turnkey runbook.

```
shift9-studio/.github  (repo)
└── shift9/                      ← pnpm workspace root (lockfile lives here)
    ├── apps/shift9-dev          → Vercel project #1  → shift9.dev
    └── apps/just-a-pinch        → Vercel project #2  → (sub)domain of choice
```

---

## 1. Supabase — already live ✅

The content source is an **existing, active** project: **`Just-a-Pinch`**
(`qdlfiewspjgbucszezja`, region `us-east-2`). No setup, no migrations, no cost.

- The landing page reads **`featured_recipes`** (141 rows) through its public
  `SELECT` policy (`featured_read_all`), using the **publishable** key.
- All access is read-only and RLS-protected. The app never holds a
  service-role key.

Connection values (public, read-only — safe to paste into Vercel):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://qdlfiewspjgbucszezja.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_b9eEZVkYfxnyBwHQJP6DjA_9nKu0QoL` |

> If Supabase is unreachable or the vars are unset, the page **falls back to a
> static seed board** — it never fails to render.

---

## 2. Vercel — two projects, same repo

Import `shift9-studio/.github` into Vercel **twice** (one project per app).
Vercel auto-detects Next.js and the pnpm workspace (it walks up from the root
directory to `shift9/pnpm-workspace.yaml`).

### Project #1 — `shift9.dev`
| Setting | Value |
|---|---|
| **Root Directory** | `shift9/apps/shift9-dev` |
| **Framework Preset** | Next.js *(auto)* |
| **Build / Install / Output** | defaults |
| **Environment variables** | none required (fully static) |
| **Domain** | `shift9.dev` |

### Project #2 — `just-a-pinch`
| Setting | Value |
|---|---|
| **Root Directory** | `shift9/apps/just-a-pinch` |
| **Framework Preset** | Next.js *(auto)* |
| **Build / Install / Output** | defaults |
| **Environment variables** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from §1) |
| **Domain** | e.g. `pinch.shift9.dev` or a standalone domain |

> **Monorepo note:** keep the **Root Directory** pointed at the app. Vercel
> installs the whole workspace from `shift9/` so `workspace:*` packages
> (`@shift9/ui`, `@shift9/motion`, `@shift9/data`, `@shift9/theme`) resolve.
> If auto-detection ever misses, set **Install Command** `pnpm install` and
> **Build Command** `next build`.

---

## 3. Local sanity check

```bash
cd shift9
pnpm install
cp apps/just-a-pinch/.env.example apps/just-a-pinch/.env.local   # live data locally
pnpm --filter just-a-pinch dev    # → http://localhost:3000  (real featured board)
pnpm --filter shift9-dev   dev    # → http://localhost:3000  (studio site)
```

Both apps build clean and prerender static:

```bash
pnpm --filter just-a-pinch build
pnpm --filter shift9-dev   build
```

---

## 4. The GitHub org profile is *not* a Vercel deploy

`../profile/README.md` renders natively on `github.com/shift9-studio` — **once
the repo is named exactly `.github` and the content is on the default branch
(`main`).** No build, no host. See the repo root README.

---

## 5. Content freshness (ISR)

`just-a-pinch` uses `export const revalidate = 3600` — the featured board
re-fetches hourly with no redeploy. To make publishes near-instant instead,
add a Supabase DB webhook → a Next.js `revalidateTag` route (blueprint §5.3);
the data layer is already centralized in `@shift9/data` to make that a
one-file change.
