# Where to research — and how to find the CURRENT winners

The point of this skill is *current* bleeding edge. Award rankings turn over monthly, and techniques that were novel two years ago are table stakes now. Always pull live results; never rely on a frozen list (including this one). Check the date and search for the present year.

## How to research (live)
1. Fan out searches across the arbiters and studios below — several queries in parallel, each from a different angle (site-of-the-year, animation collections, transitions, WebGL, GSAP, the studios' own work).
2. For each acclaimed site, identify the **concrete technique**, not a vibe. "Cursor-velocity flowmap displacing a WebGL plane," not "cool hover." If a result only says "beautiful animations," dig until you find the mechanism (case study, Codrops teardown, the studio's writeup).
3. **Verify before you trust.** Cross-check a claimed technique against a second source. Discard marketing fluff and AI-generated listicles. Prefer primary sources: case studies, the studio's own posts, Codrops tutorials, framework docs.
4. Map each technique to the target stack and the brand. Not every award site's trick fits; pick the ones that serve *this* project.

## The arbiters (community consensus)
- **Awwwards** — Site of the Year / Site of the Day; the collections are the fastest technique index: `/websites/animation/`, `/websites/transitions/`, `/websites/gsap/`, `/websites/webgl/`, `/websites/sites_of_the_year/`.
- **FWA** (thefwa.com) — heavier, more experiential/WebGL-forward winners.
- **CSS Design Awards** — Website of the Year + daily winners.
- **Godly** (godly.website) — curated, quality-over-quantity feed; great for current aesthetic direction.
- **Web Design Awards** (webdesignawards.io), **Land-book**, **Httpster**, **Minimal Gallery** — broader inspiration; lighter on technique.

## The studios that define the tier (steal their patterns)
- **Active Theory** — immersive, technically audacious experiences.
- **Lusion** — buttery 3D + interaction, with performance discipline.
- **Resn** — high-impact 3D experiential.
- **basement.studio** — closest to a crisp, brutalist/editorial engineering aesthetic; ships real products.
- Individuals worth tracking: **Bruno Simon** (3D portfolio canon), **Olivier Larose** (React/framer-motion tutorials), **Aristide Benoist**, **Unseen Studio**.

## Where the techniques are actually taught
- **Codrops / tympanus.net** — the technique library these studios pull from. Search its WebGL, typography, and transitions tags.
- **web.dev** & MDN — for the standards-track modern path: **View Transitions API**, **scroll-driven animations** (`animation-timeline: scroll()/view()`), CSS `@property`, `color-mix`, container queries.
- **Lenis** (darkroom.engineering), **GSAP** (+ ScrollTrigger/ScrollSmoother), **Three.js / React Three Fiber**, **Theatre.js**, **Rive**, **Lottie** docs.
- **Bruno Simon's Three.js Journey** — for the WebGL/shader foundation.

## The recurring techniques the best sites reward
In rough order of leverage (most impact per effort first): physics-based smooth scroll → real page/route transitions → scroll-velocity-coupled motion (type weight, shader drift) → orchestrated scrubbed reveals (not one fade everywhere) → WebGL cursor/flowmap/displacement → variable-font kinetic typography → tasteful grain/dither for tactility. The modern, JS-light versions of several of these now ship as CSS (scroll-driven animations, View Transitions) — reach for those first when support allows.
