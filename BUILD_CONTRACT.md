# BUILD CONTRACT — shift9.dev/studio "The Uncut Soundstage"

Signed by Claude Code. Binding for every commit on this build.

## The law

1. **`ORIGINAL_PROMPT.md` + handoff `README.md` + the reference build (`reference/`) + the
   reference images are the spec.** I will not deviate from them, reinterpret them, or
   "improve" them. Where they conflict, the handoff README's "Approved deviations" section
   wins, then the reference build, then the original prompt.
2. **Pixel-fidelity target.** Every set, screen, and UI element is built to match the
   reference build and reference images: same composition, same palette, same z-positions,
   same copy strings, same easings and durations, same layout. Verification is
   screenshot-vs-reference at the same camera z, every set, before a phase closes.
3. **Stack is fixed:** Vite + TypeScript + Three.js WebGPURenderer (WebGL2 fallback),
   GLSL/TSL where required, real post stack (UnrealBloom, Film, peripheral velocity blur).
   No substitutions, no framework swaps.
4. **The 8-phase plan is fixed.** Phases run in order; a phase closes only with comparison
   screenshots pushed to the branch. I do not skip ahead, merge phases, or drop scope.
5. **No basic geometry shipped as final.** Post-intro, everything the user sees is
   high-fidelity: PBR materials, real lighting rigs, the full post stack — AAA per the
   reference images (the 12-set contact sheet, the corridor set, the Pinch kitchen set).
6. **I only ask the user when a decision would break the page or change the vision**
   (including the audio redo brief). Everything else I decide and keep moving — but any
   such decision must land on whatever most closely matches the reference.
7. **Nothing merges or ships live without explicit approval.** All work stays on
   `claude/shift9-upgrade-research-t6gdna` until the user says go.

## The 8 phases

| # | Phase | Closes when |
|---|-------|-------------|
| 1 | Research + scaffold (live-audit shift9.dev + /studio, port constants/projects/accessibility verbatim) | Registry + tokens byte-compared to reference |
| 2 | Engine core (dolly velocity physics, streaming, glide, HUD plumbing) | Wheel never moves position; damping 0.05; clamp [−250, 50] verified |
| 3 | Sets 12–07 ported 1:1 | Screenshot match at each set's z |
| 4 | Sets 06–01 ported 1:1 | Screenshot match at each set's z |
| 5 | Entrance (video → desk scene → Windows 11 → tunnel dive) | Full sequence matches README §1–§4 timings and looks |
| 6 | Idle system + dossier pages + reduced-motion grid | All three idle behaviors + hard a11y gate verified |
| 7 | WebGPU + post stack + mobile simplification | Bloom/film/velocity blur live; WebGL fallback works |
| 8 | Web Audio engine + final QA | Audio brief built; lint/typecheck/build clean; touch/Esc/resize/reduced-motion pass |

Breach of any clause above is a defect to be fixed, not a judgment call to defend.
