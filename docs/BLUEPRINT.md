# SHIFT-9 — System Architecture Blueprint

> **Phase 1 deliverable** · Vision Extraction & System Architecture
> Status: `DRAFT FOR APPROVAL` · A unified digital ecosystem across three surfaces.

```
┌─ SHIFT-9 // INSTRUMENT ─────────────────────────────────────────┐
│  one theme · one codebase · three surfaces                       │
│  github.com/shift9-studio  →  just-a-pinch  →  shift9.dev         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 0. Creative Direction (locked from interview)

| Dimension | Decision | Implication |
|---|---|---|
| **Brand voice** | Declarative **+** Human | Manifesto-confident headlines, witty monospace asides. Big claims, never cold. |
| **Aesthetic** | **Cyber-Brutalist** | Visible structural grids, hairline cyan/violet rules, monospace data labels, deep `#0f172a` void, raw engineered layout. |
| **Typography** | Kinetic variable + bespoke condensed | Nazaré-DNA mega display whose `wght`/`wdth` axes animate on scroll + cursor proximity. No common fonts. |
| **Signature UX** | **"INSTRUMENT"** | The site behaves like a precision console: Dither Field hero · Proximity Weight type · Living Work Wall. |
| **Studio DNA** | Design **+** Engineering studio | We design *and* ship. Work-wall = case studies. Just a Pinch = proof we build our own. |
| **Just a Pinch** | Smart Recipes & Cooking app | Warm, appetite-driven product page; cyber-minimalist chrome around food warmth. |

**Palette evolution:** current `#00f0ff` → refined **Signal** `#22d3ee` + new **Pulse** `#8b5cf6` on **Void** `#0f172a`.

---

## 1. The "INSTRUMENT" Signature System

One unifying idea across all three surfaces — the product feels like operating a precision instrument, not reading a page. Built from three deliberately *uncommon* techniques plus a brutalist scaffold.

### 1.1 Dither Field — the hero
Not a glossy WebGL gradient (everyone has those). A real-time **monochrome Bayer-dither / halftone shader** in cyan-on-void that warps *toward* the magnetic cursor — reads like a CRT signal from the future.
- Implementation: `<DitherField/>` — WebGL fragment shader (ordered-dither over animated simplex noise), pointer position fed as a `MotionValue` uniform.
- Decorative only: `aria-hidden`, pauses when offscreen (`IntersectionObserver`), GPU-light.
- **Fallback:** no WebGL / `prefers-reduced-motion` → static pre-rendered dithered PNG. Identical beauty, zero motion.

### 1.2 Proximity Weight — the type
The variable display's `wght` + `wdth` interpolate based on cursor distance and scroll velocity. Headlines literally flex as you approach. This *is* the "animated variable + bespoke" blend, made tactile.
- Implementation: `useProximityWeight(ref)` maps pointer distance → `font-variation-settings` via a throttled `MotionValue` (rAF, never per-event).
- **Fallback:** reduced-motion → fixed optical weight, no interpolation.

### 1.3 Living Work Wall — the content engine (ref: image 1)
Your angled portfolio grid becomes a Supabase-driven, skewed brutalist tile-plane. Magnetic on hover, each label snapping its variable weight. Signature look *and* the real content system.
- Implementation: `<WorkWall/>` consumes `projects` from Supabase; CSS 3D `transform` for the skewed plane; per-tile `useMagnetic`.

### 1.4 Supporting brutalist kit (`@shift9/ui`)
| Component | Role |
|---|---|
| `<GridFrame/>` | The visible coordinate scaffold — hairline rules + corner ticks + monospace axis labels (`X:094 · Y:012`). The signature frame on every page. |
| `<MonoLabel/>` | Status-line microcopy slots — where the *witty* voice lives (`// build: stable`, `// seasoned to taste`). |
| `<MagneticButton/>` | Primary CTAs with spring-physics magnetic pull. |
| `<ProximityText/>` | Headline wrapper wiring Proximity Weight. |
| `<Skeleton*/>` | Semantic loading screens (see §4). |

---

## 2. Design System — Tokens

Single source of truth: **`@shift9/theme`**. CSS-variable primitives → semantic aliases → Tailwind v4 `@theme` mapping. Change a token once, it propagates to all three surfaces (including the GitHub SVGs, see §6).

### 2.1 `tokens.css` — primitives & semantics
```css
:root {
  /* ── Primitives ───────────────────────────── */
  --s9-void:      #0f172a;   /* base / background      */
  --s9-void-2:    #0b1120;   /* deeper panel surface   */
  --s9-signal:    #22d3ee;   /* cyan accent            */
  --s9-pulse:     #8b5cf6;   /* violet accent          */
  --s9-ink:       #e2e8f0;   /* primary text (AA+)     */
  --s9-ink-dim:   #64748b;   /* mono labels, secondary */
  --s9-line:      color-mix(in oklch, var(--s9-signal) 14%, transparent);
  --s9-line-2:    color-mix(in oklch, var(--s9-pulse)  12%, transparent);

  /* ── Semantic aliases ─────────────────────── */
  --color-bg:        var(--s9-void);
  --color-surface:   var(--s9-void-2);
  --color-text:      var(--s9-ink);
  --color-muted:     var(--s9-ink-dim);
  --color-accent:    var(--s9-signal);
  --color-accent-2:  var(--s9-pulse);
  --color-border:    var(--s9-line);

  /* ── Motion ───────────────────────────────── */
  --dur-premium:   300ms;                          /* per spec               */
  --ease-premium:  cubic-bezier(.22, 1, .36, 1);   /* refined house curve*   */

  /* ── Grid / spacing ───────────────────────── */
  --grid-unit: 8px;
  --gutter:    clamp(1rem, .5rem + 2vw, 2.5rem);

  /* ── Fluid type scale (clamp) ─────────────── */
  --text-mono:    clamp(.78rem, .74rem + .18vw, .88rem);
  --text-body:    clamp(1rem,  .95rem + .25vw, 1.13rem);
  --text-lead:    clamp(1.2rem, 1.05rem + .6vw, 1.6rem);
  --text-h2:      clamp(1.8rem, 1.3rem + 2.4vw, 3.2rem);
  --text-display: clamp(3rem,  1.6rem + 7vw,   8.5rem);  /* Nazaré mega */

  /* ── Focus & rings ────────────────────────── */
  --ring: 0 0 0 2px var(--s9-void), 0 0 0 4px var(--s9-signal);
}
```
> *Spec says `transition-premium = 300ms ease-in-out`. I honor the 300ms and recommend the `cubic-bezier(.22,1,.36,1)` curve for a more premium settle — swap back to `ease-in-out` with a one-line token change if you prefer.*

### 2.2 Tailwind v4 mapping — `theme.css`
Tailwind v4 is **CSS-first** (no `tailwind.config.js`). The theme package exports utilities directly:
```css
@import "tailwindcss";
@import "./tokens.css";

@theme inline {
  --color-bg:       var(--color-bg);
  --color-surface:  var(--color-surface);
  --color-text:     var(--color-text);
  --color-accent:   var(--color-accent);
  --color-accent-2: var(--color-accent-2);
  --font-display:   "Druk", "PP Right Grotesk", sans-serif;
  --font-mono:      "Martian Mono", ui-monospace, monospace;
  --text-display:   var(--text-display);   /* → text-display */
  --text-h2:        var(--text-h2);         /* → text-h2      */
}

/* The house transition — one utility, used on every hover state */
@utility transition-premium {
  transition-property: color, background-color, border-color, box-shadow,
                       transform, opacity, font-variation-settings;
  transition-duration: var(--dur-premium);
  transition-timing-function: var(--ease-premium);
}
```
Each app's `globals.css` is just `@import "@shift9/theme/theme.css";`. That's the entire wiring.

---

## 3. Typography

No common fonts. Self-hosted via `next/font/local` for zero layout shift; variable axes drive Proximity Weight.

| Slot | Primary (premium) | Free alternative | Axes used |
|---|---|---|---|
| **Display** | **Druk** Wide/Condensed (Commercial Type) — the definitive Nazaré-style mega-type | **Anybody** (variable, `wdth` 50–150) | `wght`, `wdth` |
| **Mono / data** | **Söhne Mono** | **Martian Mono** / **Departure Mono** | `wght` |

- The display face carries every hero, the work-wall labels, and the GitHub SVG banners — one voice everywhere.
- Phase 2 option: commission a true bespoke face or extend a variable base with custom OpenType ligatures for genuine one-of-one letterforms.

---

## 4. Global UI Standards → Implementation

| Requirement | How it's delivered |
|---|---|
| **`transition-premium`** | `@utility transition-premium` (300ms, house curve). Applied to all hover/focus states. |
| **Framer Motion springs** | `@shift9/motion` exports spring tokens — `springs.premium {stiffness:420, damping:32, mass:.9}`, `springs.magnetic`, `springs.soft`. Every interaction uses these, never ad-hoc durations. |
| **Fluid typography** | `clamp()` scale in tokens (§2.1) → `text-display`, `text-h2`, … utilities. No fixed px headings. |
| **Skeleton screens** | Semantic per-content skeletons in `@shift9/ui` (`SkeletonWorkTile`, `SkeletonFeature`, `SkeletonReview`) wired to Next.js `loading.tsx` + `<Suspense>`. Shimmer is motion — disabled to a static block under reduced-motion. |
| **`prefers-reduced-motion`** | Global CSS `@media` query **+** a `useReducedMotion()` gate in `@shift9/motion` that hard-disables Dither animation, Proximity Weight, magnetic pull, parallax, shimmer. One switch, whole system. |
| **`focus-visible`** | Global high-contrast ring (`--ring`, cyan double-stroke with void offset). Outlines never removed — only restyled. Every interactive primitive ships it by default. |
| **Color contrast** | Body text = `--s9-ink` on `--s9-void` (AA+). Cyan/violet reserved for large display, borders, and UI accents — never small body text. Contrast asserted in CI (axe). |

---

## 5. Data Architecture — Supabase (single instance)

One Supabase project is the **content source of truth** syncing all three surfaces.

### 5.1 Schema (core tables)
```
studio          singleton  · manifesto, tagline, contact, socials
projects        work-wall  · title, slug, role, year, cover, tags[], accent,
                             wall_skew, wall_order, status(published|draft)
project_media   1—n        · project_id, url, kind, alt
services        list       · name, blurb, icon, order
app_features    JAP        · app, title, body, icon, order
app_screens     JAP        · app, url, caption, device
testimonials    JAP        · author, role, quote, avatar, rating
posts           blog       · title, slug, body(mdx), published_at, tags[]
theme_tokens    live brand · key, value  (optional override layer, see §6.3)
```

### 5.2 Access & types
- **RLS:** public `SELECT` on `status = 'published'` rows; all writes via service-role from the Studio admin only.
- **Type safety:** `supabase gen types typescript` → consumed by **`@shift9/data`**, which exports a typed client + query functions (`getProjects()`, `getAppFeatures('just-a-pinch')`, …). Apps never touch raw SQL.

### 5.3 Sync strategy (how content propagates)
| Surface | Mechanism |
|---|---|
| `shift9.dev`, `just-a-pinch` | Next.js Server Components + **ISR**. Supabase DB webhook → Next.js `/api/revalidate` (`revalidateTag`) on publish → near-instant updates, no redeploy. |
| GitHub profile | Supabase webhook → `repository_dispatch` → GitHub Action regenerates `profile/README.md` + SVGs from Supabase + theme → commits. *Even the markdown-only surface stays in sync.* (see §6.2) |

---

## 6. System Architecture — Unified Monorepo

**Turborepo + pnpm workspaces.** One repo, one theme, three deploy targets. Turborepo gives task orchestration + remote caching so CI stays fast as the system grows.

### 6.1 Structure
```
shift9/
├── apps/
│   ├── shift9-dev/          # Platform 3 — studio flagship (Next.js App Router)
│   │   └── Dither hero · manifesto · Living Work Wall · services · blog
│   ├── just-a-pinch/        # Platform 2 — product landing (Next.js App Router)
│   │   └── recipe-app story · features · screens · reviews · CTA
│   └── github-profile/      # Platform 1 — generator (Node script, not a site)
│       └── reads theme+Supabase → emits profile/README.md + branded SVGs
├── packages/
│   ├── theme/               # @shift9/theme — TOKENS (single source of truth) §2
│   ├── ui/                  # @shift9/ui — DitherField, WorkWall, GridFrame, buttons, skeletons
│   ├── motion/              # @shift9/motion — springs, useMagnetic, useProximityWeight, reduced-motion gate
│   ├── data/                # @shift9/data — typed Supabase client + queries §5
│   └── config/              # @shift9/config — shared tsconfig / eslint / prettier
├── supabase/                # migrations · seed · generated types
├── turbo.json · pnpm-workspace.yaml · package.json
```

### 6.2 The GitHub surface is *generated*, not hand-written
The org `.github` profile (this repo) renders **markdown only** — no JS, no external CSS. To keep it perfectly on-brand, `apps/github-profile` is a build step that reads `@shift9/theme` tokens + Supabase content and emits:
- `profile/README.md` (the public org landing page),
- **branded SVG** hero banner + stat cards (animated SVG dither motif, themed light/dark via `<picture>` + `prefers-color-scheme`).

So even the most constrained surface shares the exact palette, type, and motif. **This is the unification proof.**

### 6.3 How one theme drives three surfaces
```
            ┌─────────────────────┐
            │  @shift9/theme      │  ← single token source (CSS vars + @theme)
            └─────────┬───────────┘
        ┌─────────────┼──────────────────────┐
        ▼             ▼                       ▼
  shift9.dev     just-a-pinch          github-profile
  (Tailwind v4)  (Tailwind v4)         (SVG generator)
        └─────────────┴───────────────────────┘
                      ▲
            optional: theme_tokens (Supabase)
            live central override → rebrand with no redeploy
```
Edit `--s9-signal` once → both Next.js apps recompile against it **and** the next GitHub generation paints SVGs in the new cyan. The optional `theme_tokens` table lets a non-developer retune accents centrally.

### 6.4 Deploy
| Surface | Target |
|---|---|
| `shift9.dev` | Vercel project, root `apps/shift9-dev`, Turbo remote cache |
| `just-a-pinch` | Vercel project, root `apps/just-a-pinch` (or `shift9.dev/just-a-pinch`) |
| GitHub profile | GitHub Action → commits generated `profile/README.md` to `shift9-studio/.github` |

---

## 7. Phase Roadmap

- **Phase 1 — Vision & Blueprint** ✅ *(this document)*
- **Phase 2 — Foundation & Flagship** *(proposed)*: scaffold the monorepo, build `@shift9/theme` + `@shift9/ui` + `@shift9/motion`, ship `shift9.dev` with the full INSTRUMENT signature + Supabase work-wall.
- **Phase 3 — Ecosystem**: build `just-a-pinch`, the generated GitHub profile, wire Supabase sync end-to-end, deploy all three, accessibility + perf audit.

---

## 8. Open decisions before Phase 2

1. **Hosting** — Vercel for the two Next.js apps? (Assumed.) Any preference on the Supabase region/existing project?
2. **Type budget** — green-light premium licenses (Druk + Söhne Mono), or build entirely on the free variable stack (Anybody + Martian Mono)?
3. **Just a Pinch domain** — standalone domain, or `shift9.dev/just-a-pinch` subpath?
4. **Phase 2 scope** — confirm "foundation + shift9.dev flagship first" is the right opening move.

> Nothing here is built yet — this is the architecture for your approval. Say the word and we move to Phase 2.
