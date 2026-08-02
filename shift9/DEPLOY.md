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
| **Environment variables** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from §1; required for Flow State beta intake), `RESEND_API_KEY` (server-only; required for confirmation email) |
| **Domain** | `shift9.dev` |

### Project #2 — `just-a-pinch`
| Setting | Value |
|---|---|
| **Root Directory** | `shift9/apps/just-a-pinch` |
| **Framework Preset** | Next.js *(auto)* |
| **Build / Install / Output** | defaults |
| **Environment variables** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from §1) |
| **Domain** | e.g. `pinch.shift9.dev` or a standalone domain |

### Skipping builds that can't change anything

`apps/just-a-pinch/vercel.json` carries an `ignoreCommand`. Vercel runs it from
the project's Root Directory and reads the exit code — **0 skips the build**,
non-zero builds — which is exactly `git diff --quiet`'s contract:

```
git diff --quiet HEAD^ HEAD -- . ../../packages ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ../../turbo.json
```

The watched paths are the app itself, the shared packages it imports
(`@shift9/theme`, `ui`, `motion`, `data`), and the workspace files that decide
what gets installed and built. Everything else in the repo — all of
`apps/shift9-dev`, `profile/`, `docs/` — cannot affect this deployment, so it
shouldn't spend one. On a merge commit `HEAD^` is the first parent, i.e. the
base branch before the merge, so the comparison still sees every file the merge
brought in.

It matters because the free tier allows 100 deployments a day and both projects
build on every push to the shared repo. Measured against the 95 commits of the
entry-experience branch, 94 of them touch only `shift9-dev` — so Pinch was
rebuilding, identically, 94 times for no reason.

`apps/shift9-dev/vercel.json` carries the same command. It watches `public/`
along with everything else, deliberately: the tempting version excludes
`public/experience` so asset-only commits skip the build, but that would let a
commit adding *nothing but a new video or image* skip the production deploy,
and the asset would 404 on the live site with a green checkmark beside it. As
written it only skips commits that touch neither this app nor the shared
packages — Pinch-only changes, `profile/`, `docs/`.

**The cap is real, and it is per day across the whole account.** On the night
of 2026-07-25 both projects started returning *"Deployment rate limited — retry
in 24 hours"*: a long working session of small, frequent commits, each firing
two builds, exhausted the free tier's 100. The `ignoreCommand`s roughly halve
that, but the other half of the fix is behavioural — batch commits while
iterating rather than pushing each edit, because every push to this repo is
two builds until one of them opts out.

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

### Checking Flow State signups

Open the Supabase project `qdlfiewspjgbucszezja`, choose **Table Editor** →
**waitlist**, and filter `source` to `flow-state`. Customer addresses stay in the
private dashboard; the public app has insert-only access and cannot list them.
Use Resend's **Emails** dashboard to check confirmation delivery, bounces, and
suppression. The dedicated key is named `Flow State confirmation`, has sending
access only, and is restricted to the verified `shift9.dev` domain.

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
