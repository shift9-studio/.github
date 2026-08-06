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
8. **Highest-quality assets only, no substitutions — ever** (user directive,
   2026-07-21). This is a fresh, brand-new website. No placeholder geometry, no
   "good enough" stand-ins, no quiet downgrades at any later phase. If a set can't
   yet be built at reference-image quality, the phase stays open — quality is never
   traded for schedule. The finished 3D space must look exactly like the reference
   images.
9. **The twelve sets are built ONE PER FRESH SESSION** (user directive,
   2026-07-21, second session). At the start of each set's session, STOP and wait
   for the user to provide reference images showing exactly how that set must
   look — do not build the set's visuals before they arrive. Twelve set sessions
   (phase 3 = sets 12→07, phase 4 = sets 06→01), then one consolidation session
   that brings everything together and verifies the full run before the next
   phase. The user verifies every set visually — in-chat renders vs their
   reference images — and a set is done only on their explicit pass. All
   explanations to the user in plain, simple terms; no jargon, ever.

10. **The cinema stack is engine-wide law** (user directive, 2026-07-21,
    set-12 session): every stage is built and judged under the full stack —
    true soft shadow mapping, HDR bloom, a final film grade matched to the
    reference plates, a shared black-soundstage environment map for all
    reflective/satin surfaces, volumetric key-light haze, rounded-edge
    joinery, and PBR texture work (procedural or scanned) on every visible
    surface. Pulled forward from Phase 7 by the user; visuals must read
    "ultra premium — as if a senior Disney-calibre designer built it".
    Screen-space AO (GTAO) was trialled and removed — it blacks out whole
    surfaces on some GL stacks; occlusion is baked per set instead.

## Judging protocol (user is the sole judge)

- Every phase gate delivers into chat: screen recordings of the real running
  build + side-by-side stills vs the reference at identical camera positions,
  and the same evidence is committed under `shift9/apps/studio/compare/`.
- A private test link (throwaway preview deployment, never wired to shift9.dev)
  is redeployed each phase so the user can drive the build themselves.
- A phase is done ONLY when the user says pass. Claude never self-certifies.
  "Fix X" reopens the phase; fix until pass, no excuses.

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
