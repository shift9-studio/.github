# Phase 1 research — live-site inventory + award-site build analysis

Done before any production code, per the build plan. Two questions answered here:
what content the current live site holds (so nothing is lost in the upgrade), and
how the award-winning cinematic WebGL sites are actually built (so the production
stack copies proven technique, not guesswork).

## A. Live shift9.dev content inventory (what must survive the upgrade)

### `/` — "Enter the Studio" (video splash → fake OS desktop)
- Intro: `/intro.mp4` splash, SKIP button, reduced-motion bypass.
- Desktop: shift9.dev app icon → `/studio`, folders **Apps / Games / Tools / About**,
  decorative sidebar + taskbar, Grid/Icons toggle, mailto help dot.
- Folder-window copy lives **only in the client JS chunk** — inventoried in full and
  reconciled into the new PROJECT REGISTRY (Apps: Just a Pinch, Flow State, Learning
  App, Lumen Projection Mapper · Games: Voxel Arcade Basketball, Midnight Return,
  Game Design Forge · Tools: Neon Forge→Titanium Forge Pro, INSTRUMENT, Automation
  Systems, Omni-3D, WinFix).
- About window: Kariim's bio (restaurants → all-in on product building), signature
  `— KARIIM · SHIFT-9`, hire-me + contact block (shift9.dev@gmail.com).

### `/studio` — INSTRUMENT work-wall site
- Hero `We design & ship.`, manifesto, Work Wall (10 tiles with CloudFront hover
  videos), capabilities (Design / Engineering / Systems), contact, footer.
- 10 work-detail routes under `/work/<slug>`.

### Carry-over decisions locked by the handoff
The new build's PROJECT REGISTRY (12 sets) is the successor of both surfaces above;
its copy is already reconciled and user-approved in `handoff/README.md`. Name drift
noted for the record: live "whome Diagnostic" = WinFix (renamed); Voxel Basketball
tagged Python on the wall but Godot in the folder window — registry copy wins.

## B. How the award winners build it (verified where possible)

First-hand sources: **Bruno Simon folio-2025 production source** (read in full),
**Lusion WebGL-Scroll-Sync README**, **Slow Roads web.dev case study**. Snippet-level:
Igloo Inc / Persepolis / Active Theory case studies (host 403s egress; quoted from
search snippets).

| Technique | Source | Use in this build |
|---|---|---|
| WebGPURenderer + TSL node post stack, quality tiers (desktop: bloom 5 mips + DOF; mobile: bloom 2 mips, no DOF; AA off at DPR≥2) | Bruno folio-2025 (verified in code) | Phase 7 post stack + mobile simplification |
| Scroll → smoothed parameter, camera keeps drifting after input stops | Codrops dolly recipes; matches our damped-velocity contract exactly | Phase 2 engine (already specced in ORIGINAL_PROMPT) |
| Corridor streaming on a fixed path: prefetch N+1, keep N−1, dispose beyond; object pooling, no per-frame allocs | Slow Roads (web.dev, verified) | Phase 2 streaming + per-set dispose |
| gltf-transform pipeline: Draco edgebreaker 12/6/6 + KTX2 basis for every GLB | Bruno's scripts/compress.js (verified) | Any imported asset from Phase 3 on |
| "AAA" look = baked/authored lighting + PBR only near camera, not brute-force realtime | Bruno (all baked), Igloo/Lusion (Houdini-authored), Persepolis (two prerendered states blended) | Phases 3–4 set fidelity passes |
| One persistent canvas; never multiple GL contexts | Lusion (verified README) | Single renderer across all stages |
| Instancing + frustum culling + LOD inside each set | Persepolis (snippets) | Heavy sets (corridor, datacenter, warehouse) |
| Grey-box previz first, art pass second | Igloo (snippets) | Already satisfied — the reference build IS the previz |
| Quality manager as runtime event bus | Bruno Quality.js (verified) | Phase 7 device tiers |
| Reduced-motion static fallback | Almost no award site does it; ours is a hard gate | Shipped in Phase 1 scaffold |

Bruno's source stays cloned in the session scratchpad for reference while porting.

## C. Comparison harness (contract enforcement)

`compare/ref/ref-z*.png` — the reference prototype driven headless (local Chromium +
SwiftShader, CDN deps pinned locally) and screenshotted at all 12 set positions.
Every set port in Phases 3–4 is screenshotted at the same z and iterated until it
matches before the phase closes.
