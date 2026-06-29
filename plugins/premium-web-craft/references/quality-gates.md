# Quality gates + the gotchas that only bite at runtime

These are not optional polish — they are the difference between "award-tier" and "broke the site." Apply all of them to every effect.

## Reduced motion
- One gate, whole system. A single hook/contract (`prefers-reduced-motion`) that every effect reads. Under reduced motion: no smooth-scroll construction, no velocity coupling, no parallax, no shimmer, no cursor flourishes — each effect lands on its **resting frame**, identical to the static design.
- Global CSS belt-and-suspenders: an `@media (prefers-reduced-motion: reduce)` block that collapses `animation-duration`/`transition-duration` to ~0 and forces `scroll-behavior: auto`.
- Never branch *render output* on the reduced flag in a way that differs between server and client — it causes hydration mismatch. Gate the *effect*, not the markup.

## Performance budget
- **rAF, not per-event.** Throttle pointer/scroll work to one frame. Prefer ONE shared listener + ONE rAF + ONE IntersectionObserver fanned out to consumers, over N independent ones.
- **Cap DPR** (≤1.5–2) for canvases/shaders. **Pause offscreen** via IntersectionObserver. **Pause on tab hidden** (`visibilitychange`).
- **Don't thrash layout:** batch reads (`getBoundingClientRect`) then writes; animate `transform`/`opacity`/`clip-path`, not layout properties.
- **WebGL:** `powerPreference: "low-power"`, one fragment pass when possible, static-frame fallback if the context is missing or reduced motion is on.
- Watch **LCP**: a full-page opacity fade-in on first load delays the largest paint. Skip the content fade on first load; run the full transition only on client navigations.

## Accessibility
- Focus rings: restyle, never remove. Every interactive primitive ships a high-contrast `:focus-visible`.
- Decorative layers: `aria-hidden`, `pointer-events: none`. Decorative/animated text keeps its real accessible name (`aria-label`) while the animated node is `aria-hidden`.
- No content gated behind motion; transitions must not delay or trap focus. Honor `prefers-reduced-motion` and `prefers-contrast`.

## Verification protocol — build is necessary, NOT sufficient
Typecheck + production build catches types and SSR/prerender errors. It does **not** catch the bugs that matter most here, which are runtime/visual. Always:
1. Run the production build; confirm routes prerender as expected.
2. **Drive a real (headless) browser.** Load the built app, scroll the full page, and assert the effect actually happened — count revealed elements, check computed `opacity`/`clip-path`, screenshot. Chromium is typically pre-installed; if the Playwright npm version mismatches the browser build, launch with an explicit `executablePath` to the installed binary.
3. **Re-run with reduced motion emulated** (`page.emulateMedia({ reducedMotion: 'reduce' })`) and confirm the resting frame is correct and nothing is stuck hidden.
4. Sanity-check a low-end profile for shader/particle work.

A concrete cautionary tale: a Work Wall reveal compiled and built clean but only showed 6 of 10 tiles in the browser — the bug was invisible to the compiler. See the IntersectionObserver gotcha below. The headless-browser count is what caught it.

## Gotchas the compiler will never catch
- **IntersectionObserver inside `transform-style: preserve-3d` / a rotated plane is unreliable.** Per-element `whileInView`/IO observers on children of a 3D-rotated container may never fire for some rows → elements stuck hidden. **Fix:** orchestrate the reveal from a non-transformed ancestor (one observer + staggered children via variants), not per-child observers inside the 3D context.
- **`transform`, `filter`, `perspective`, `will-change`, `contain` on an ancestor establish a containing block for `position: fixed` descendants.** Wrapping a page in a transformed/filtered transition wrapper silently breaks fixed overlays (custom cursor, sticky frames, modals). **Fix:** page transitions use opacity only on the content wrapper; do transformed motion on a separate fixed overlay that has no fixed descendants.
- **`fontVariationSettings` strings do not interpolate** in most animation libs (e.g. framer-motion) — they snap. **Fix:** animate a numeric CSS custom property (`--wght`) and reference it, or write the axis in a rAF loop.
- **Tailwind v4 emits standalone `translate`/`scale`/`rotate` properties** (not the `transform` shorthand), so framer-motion's `transform`-based `x/y/scale` *composes* with Tailwind centering like `-translate-x-1/2` instead of overwriting it. Rely on this rather than fighting it.
- **`clip-path` reveals + 3D:** clip-path can flatten/disturb a `preserve-3d` subtree; test the combination, or reveal with opacity/transform inside 3D contexts.
- **`useReducedMotion()` is `null` until measured** — collapse to a stable boolean and don't let the first render differ from SSR.
- **Lenis vs CSS `scroll-behavior: smooth`** conflict — let Lenis own it (it sets `scroll-behavior: auto`), keep CSS smooth only as the no-JS fallback, and the reduced-motion block forces auto.
