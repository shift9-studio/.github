# Technique catalog — tier by tier

Bleeding-edge, but each one earns its place only if it passes the gates in `quality-gates.md`. Treat this as a menu to propose from, not a checklist to dump. Prefer the modern CSS-native version of a technique when browser support allows; fall back to JS where it doesn't.

---

## Tier 1 — Foundation (highest leverage, lowest risk)
The fastest perceived jump. Do this before anything flashy.

- **Motion token system.** Replace a single duration/easing with a scale:
  - durations: `fast ~140ms`, `base ~240ms`, `slow ~480ms`, `boot ~720ms`.
  - easings: a decelerate curve for entrances (`cubic-bezier(.16,1,.3,1)`), an accelerate curve for exits, a symmetric in-out for travel, an overshoot for snaps/locks.
  - a stagger token (~60ms).
  One edit, system-wide tempo hierarchy. Everything that animates pulls from these — never an ad-hoc number.
- **Physics smooth scroll.** Lenis (or GSAP ScrollSmoother), synced to one rAF, **off under reduced motion**. This alone shifts the whole feel and unlocks scroll velocity as an input for everything below. Smooth in-page anchor navigation through it too.
- **A reveal vocabulary.** Kill the one-fade-up-everywhere. Offer: a rise, a clip-path scan/wipe, a headline mask-up, a plain fade — plus a *staggered group* so grids animate as one orchestrated entrance, not N independent observers. (See the 3D + IntersectionObserver gotcha in quality-gates.)

## Tier 2 — Interaction polish
- **Magnetic elements.** Spring-physics pull toward the cursor within a radius; release on a spring (add inertia, don't snap to 0). Buttons, tiles, links.
- **Custom cursor done right.** Multi-layer lag (fast dot, trailing ring, slower light bloom) for depth; **velocity squash-and-stretch** (scale along travel direction); **docking** onto interactive targets (scale + a lock-on reticle); a click pulse. Screen-blend a bloom so it only adds light. Pointer-fine only; flourishes gated by reduced motion.
- **Button micro-interactions.** Entry-aware fill sweep (origin = the edge the cursor entered), label/arrow flip to read against the fill, the icon drawing in. Keep the pull.
- **Skeletons that aren't lazy.** A directional shimmer sweep over a surface-tinted block, not a whole-block opacity pulse. Frozen to a flat panel under reduced motion.

## Tier 3 — Signature showstoppers
The one-of-one moves that make a site memorable. Pick a few that fit the brand.

- **Scroll-velocity-coupled kinetic type.** Variable-font `wght`/`wdth` respond to cursor distance AND scroll velocity — headlines gain weight and compress as you fly, settle when you stop. (Drive the axis via a numeric CSS var or rAF; `fontVariationSettings` strings do not interpolate — see gotchas.)
- **WebGL hero fields.** Ordered-dither / halftone over animated noise (a CRT-from-the-future look that isn't another glossy gradient); a cursor **flowmap** that leaves a decaying wake; **scroll-velocity drift**; a **click ripple**. Keep it one fragment pass when you can; re-skin by passing the palette as uniforms.
- **Displacement & post.** RGB-shift / chromatic aberration on scroll velocity, displacement maps on hover, **ping-pong feedback** shaders (phosphor trails), bloom — added only on capable GPUs.
- **Page / route transitions.** The **View Transitions API** first (cross-document and SPA), or framer/FLIP/shared-element. Make navigation feel like the product "booting" or a shared element flying. CAUTION: do not wrap the page in a transformed/filtered element (breaks `position: fixed`); use opacity + a separate overlay (see gotchas).
- **Scrubbed scrollytelling.** GSAP ScrollTrigger pins/scrubs, or native **scroll-driven CSS animations** (`animation-timeline: view()`), for cinematic reveals tied to scroll position.
- **Text effects with taste.** Decode/scramble-in (terminal decrypt), line-by-line masked reveals, variable-font morphing. Width-stable (monospace or measured), a11y-safe (real text is the accessible name, animated layer `aria-hidden`).
- **Living textures.** Subtle film grain / dither / noise (SVG fractalNoise or a shader), blended soft-light, very low opacity. Reads as "expensive" without announcing itself.
- **Hero parallax / ken-burns.** Scroll-linked scale + translate, overscanned so the drift never exposes an edge.

## Stack notes
- **React:** framer-motion (springs, `useScroll`/`useVelocity`/`useTransform`, variants, `whileInView`), React Three Fiber + drei for WebGL, Lenis, GSAP where timelines beat springs.
- **Vanilla / any framework:** GSAP + ScrollTrigger + Lenis, raw Three.js, native scroll-driven animations + View Transitions for the JS-light path.
- **Variable fonts** are the cheapest "bespoke" lever — animate real axes; pair a display variable face with a mono/data face.
- Favor **one shared engine, re-skinned** (palette/typography swap) over per-surface reimplementation — it's how studios keep many surfaces coherent.
