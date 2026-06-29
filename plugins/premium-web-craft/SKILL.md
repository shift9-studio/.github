---
name: premium-web-craft
description: Research the CURRENT award-winning, bleeding-edge web (Awwwards / FWA / CSS Design Awards / Godly + the top motion studios) and apply those visual and motion techniques to a codebase — then harvest the results into a reusable, accessible UI/UX component library. Use when the user wants high-end animations or transitions, wants to elevate a site's visuals to award tier, asks how the best sites are built, wants bleeding-edge / "expert level" / "no slop" visual effects, or wants to build or extend a personal component library. Every technique ships reduced-motion-safe, performant, and accessible.
metadata:
  trigger: Elevating visual/motion polish, studying award-winning web technique, building a UI/UX component library
---

# Premium Web Craft

Take a site from "fine" to award-tier, and turn what you build into a library you reuse. The method is a loop: research the live state of the art, audit what's there, propose in tiers, build, tune, **verify in a real browser**, and harvest the reusable pieces. Quality gates are non-negotiable — reduced-motion, performance, accessibility, and no slop apply to every effect.

## When to use
- "Make these animations/transitions feel premium / high-end / apex / bleeding-edge."
- "What do the best sites do, and can we do it here?"
- "Build me a reusable set of UI/UX motion components."
- Any time visual polish is the goal and "looks like everyone else" is the failure.

## The loop

1. **Research — live, not from memory.** Award winners change monthly. Use WebSearch/WebFetch to pull the *current* highest-regarded sites and the technique behind each. Fan out across the arbiters and studios in `references/sources.md`. For each exemplar, name the concrete technique (not "nice animations" — "scroll-velocity-driven RGB-shift on a WebGL plane"). Verify claims against more than one source; discard hype. Map each technique to the project's actual stack.

2. **Audit.** Read the target's current design/motion system: tokens (durations, easings), how things animate, the reduced-motion story, the component kit. Name what reads cheap and *why* (usually: one duration, one easing, one reveal everywhere; no page transitions; nothing reacts to scroll velocity).

3. **Propose in tiers.** Group upgrades by impact/effort. Foundation first (token scale + easing set, smooth scroll, a reveal vocabulary). Then interaction polish. Then signature showstoppers unique to the brand. Give a short menu with a recommended first move; let the user pick scope. See `references/techniques.md`.

4. **Build.** Tokens before components. Match the existing code's idioms. Gate every effect behind the reduced-motion contract from the start, not as a retrofit.

5. **Tune.** New effects have guessed magnitudes. Adjust feel; fix any LCP/perf regression you introduced. Smaller and intentional beats louder.

6. **Verify in a real browser.** Typecheck + build is necessary, not sufficient. Many of these bugs are invisible to the compiler and only show at runtime (a reveal that never fires, a transition that breaks `position: fixed`). Drive a headless browser, scroll, and confirm the thing actually happens — and confirm reduced-motion parity. See `references/quality-gates.md`.

7. **Harvest.** Pull the reusable pieces into the user's component library: tokens, the reduced-motion gate, the hooks, the components — each documented with its perf and a11y notes. See `references/component-library.md`.

## Non-negotiables (every effect, no exceptions)
- **Reduced-motion parity.** One gate; every effect collapses to a calm resting frame. Never bypass it.
- **Performance budget.** rAF, never per-event work; cap DPR; pause offscreen (IntersectionObserver); prefer one shared listener/loop; write transforms, batch reads. WebGL: low-power context, single pass where possible.
- **Accessibility.** Focus rings restyled, never removed. Decorative layers `aria-hidden`; decorative text keeps its accessible name. No content gated behind motion. SSR-safe: no hydration mismatch, no layout shift.
- **No slop.** Specific over generic, restraint over noise. If an effect doesn't earn its frame budget or its attention, cut it. Apply the same bar to any microcopy you write.

Read `references/quality-gates.md` before building — it includes the hard-won runtime gotchas (3D + IntersectionObserver, transform/filter breaking fixed overlays, first-load LCP, variable-font interpolation, Tailwind v4 transforms) that the compiler will not catch.

## Reference files
- `references/sources.md` — where to research, and how to find the *current* winners.
- `references/techniques.md` — the bleeding-edge technique catalog, tier by tier.
- `references/quality-gates.md` — the verification protocol + the gotchas that only bite at runtime.
- `references/component-library.md` — how to structure a reusable, framework-honest UI/UX codebase.

## Scope to the ask
A quick "make this nicer" gets a few high-leverage moves (tokens, smooth scroll, a real reveal). "Take it to award tier" gets the full loop with signature WebGL/scroll/cursor work and a verification pass. Match effort to intent; always keep the gates.
