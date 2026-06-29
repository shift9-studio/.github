# Building a reusable UI/UX library from the work

The goal: every effect you ship on a project becomes a clean, documented, reusable unit you can drop into the next one. Harvest as you go — don't let good work stay trapped in one app.

## Principles
- **Tokens are the root.** A single source of color, type scale, and motion (durations/easings/stagger). Components reference tokens, never hard-coded values. Re-skinning is then a token swap, not a rewrite.
- **One engine, re-skinned.** Prefer a shared, palette-driven component (pass colors/typography as props/uniforms) over per-surface forks. This is how studios keep many surfaces coherent.
- **Reduced-motion is built in, not bolted on.** Ship the gate with the library; every component consumes it.
- **Framework-honest.** Pick a primary stack (e.g. React + framer-motion + R3F) but isolate framework-specific bits behind a small surface, and note a vanilla/GSAP fallback where the technique is portable. Keep dependencies minimal and intentional.
- **Copy-paste friendly.** Favor self-contained components with explicit props over a heavy framework. A registry/index + per-component docs beats a monolith. (shadcn-style "own the code" distribution works well for this.)

## Suggested structure
```
ui-lab/
├── tokens/            # colors, type scale, durations, easings, stagger — the source of truth
├── motion/            # hooks: reduced-motion gate, scroll signal/velocity, magnetic, proximity-weight
├── components/        # each effect as a unit (cursor, dither field, magnetic button, reveal, decode text, parallax, page-transition, skeleton)
├── shaders/           # GLSL / R3F materials, palette-as-uniforms
├── registry.json      # index: name, deps, files (for copy-paste install)
└── docs/ or *.mdx     # per-component: demo, props, perf notes, a11y notes, reduced-motion behavior
```

## Every component ships with
- A live demo / story.
- Props (and which are tokens).
- **Reduced-motion behavior** (what the resting frame is).
- **Performance notes** (rAF? DPR cap? offscreen pause? shared listener?).
- **Accessibility notes** (focus, aria, SSR-safety).
- Stack + portability note (React-only? vanilla fallback?).
- A version/date and the source technique it came from (link the case study / Codrops teardown).

## Harvest checklist (run after each project)
1. What new effect did this project produce that's reusable?
2. Generalize it: strip app-specific assumptions, surface tokens/props, confirm the reduced-motion gate.
3. Verify it standalone (the browser protocol in `quality-gates.md`).
4. Document it (the block above).
5. Add to `registry.json`; bump the version.
6. Note what it improved on vs the last version (the library should get better, not just bigger).

## Keep it current
The library is a living thing. When research (`sources.md`) surfaces a technique that beats one you already have, replace it and note why. Prune anything that's become table-stakes-or-worse. A small library of genuinely bleeding-edge, battle-tested pieces beats a large one full of yesterday's defaults.
