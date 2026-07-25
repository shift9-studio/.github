# Entry experience — asset log

Every generated asset in the shift9.dev entry experience, in the order it was
approved. `assets.json` beside this file is the machine-readable manifest the
`fetch-experience-assets` workflow reads; this file is the human record.

**Rules that produced these:** one job at a time, no duplicates, no auto-retry.
A refinement is a new job only after Kariim rejects the previous one.

## Studio set-pieces — the uncut dolly

Style contract and the full roster live in `docs/STUDIO-DOLLY.md`.

| # | Project | Status | File | Job | Credits | Verdict |
|---|---|---|---|---|---|---|
| 01 | Just a Pinch | LIVE | `set-pieces/01-just-a-pinch.png` | `81e13a22-7b12-4725-a1df-e72205ccae61` | 4 | **Approved** |

Rejected takes, kept so the same mistake is not paid for twice:

| Job | Why it was rejected |
|---|---|
| `174ee312-98be-4ac8-820c-d09ac89d819b` | Camera too close. The set-piece has to read as a lit diorama on a huge dark stage — subject in the middle third, deep negative space around it. Every later prompt bakes that framing in. |

**Still to shoot:** 02 Flow State · 04 Lumen Projection Mapper · 05 Voxel Arcade
Basketball · 06 Midnight Return · 07 Game Design Forge · 08 Neon Forge →
Titanium Forge Pro · 09 INSTRUMENT · 10 Automation Systems · 11 Omni-3D ·
12 WinFix. **03 Learning App artwork is supplied — never regenerate it.**

Ten renders left at 4 credits each = **40 credits**.

## Built in code, not generated

| Asset | Where | Note |
|---|---|---|
| Desktop wallpaper | `app/_components/AsciiWallpaper.tsx` + `ascii-art-data.ts` | Live animated ASCII derived from the real `s9-banner-still.jpg` and `s9-icon.png` by `scripts/build-ascii-art.py`. Regenerate with `python3 shift9/apps/shift9-dev/scripts/build-ascii-art.py`. Costs nothing, stays crisp at any resolution. |
| Desktop icon hover | `app/_components/EnterTheStudio.module.css` | Lift, glass card, one-pass sheen, folder lip opening in 3D. 3D is desktop-pointer-only; reduced motion keeps the full colour response and drops the movement. |

## How an asset gets into the repo

The session that approves a render may sit behind an egress policy that blocks
the generator's CDN. So: the approving session appends the URL to
`assets.json`, and the `fetch-experience-assets` GitHub Action — which has open
egress — downloads it and commits it to the same branch. No file is ever passed
by hand.
