# Entry experience — asset log

Every generated asset in the shift9.dev entry experience, in the order it was
approved. `assets.json` beside this file is the machine-readable manifest the
`fetch-experience-assets` workflow reads; this file is the human record.

**Rules that produced these:** one job at a time, no duplicates, no auto-retry.
A refinement is a new job only after Kariim rejects the previous one.

## Studio set-pieces — the uncut dolly

Style contract and the full roster live in `docs/STUDIO-DOLLY.md`.

Every project ships as two assets: an approved **plate** (16:9 still, locks the
composition) and a **clip** animated from that plate as its start frame, so
geometry and framing carry over exactly.

| # | Project | Status | Asset | Job | Credits | Verdict |
|---|---|---|---|---|---|---|
| 01 | Just a Pinch | LIVE | plate `set-pieces/01-just-a-pinch.png` | `81e13a22-7b12-4725-a1df-e72205ccae61` | 4 | **Approved** |
| 02 | Flow State | SHIPPING | plate `set-pieces/02-flow-state.png` | `69320e31-c80f-4624-8004-2c6cf21e76d3` | 4 | **Approved** |
| 02 | Flow State | SHIPPING | clip `set-pieces/02-flow-state-v2.mp4` — 5s, camera locked, only the fluid moves | `aceb808f-47bb-4526-9e8d-ff3f04644c12` | 8.75 | **Approved** |
| 04 | Lumen Projection Mapper | IN DEV | plate `set-pieces/04-lumen.png` | `96727da3-0b52-4db2-a47f-1939aeb92a1c` | 4 | **Approved** |
| 04 | Lumen Projection Mapper | IN DEV | clip `set-pieces/04-lumen.mp4` — 10s, calibration locks then the acid-trip pass floods the boxes | `d8e85d5d-7938-4161-a66d-0d6e78356f48` | 17.5 | **Approved** |
| 05 | Voxel Arcade Basketball | IN DEV | plate `set-pieces/05-voxel-arcade-v3.png` | `d15474fb-ba16-44c5-a0a1-12b39a306cf7` | 4 | **Approved** |
| 05 | Voxel Arcade Basketball | IN DEV | clip `set-pieces/05-voxel-arcade-v3.mp4` — 5s, the voxel shot drops, CRT tears, a neon segment dies | `71b0e7dd-0002-4493-b8d5-d7cfa7e38fe7` | 8.75 | **Approved** |

**Video settings that produced the clip** (the canary that proved the pipeline):
`kling3_0`, `mode: pro`, `sound: off`, `duration: 5`, `aspect_ratio: 16:9`,
`medias: [{role: start_image, value: <plate job id>}]`. 8.75 credits. Seedance
2.0 at 1080p costs 45 for the same five seconds and was rejected on price —
the plate already carries the detail, the clip only has to move it.

Rejected takes, kept so the same mistake is not paid for twice:

| Job | Why it was rejected |
|---|---|
| `174ee312-98be-4ac8-820c-d09ac89d819b` | Camera too close. The set-piece has to read as a lit diorama on a huge dark stage — subject in the middle third, deep negative space around it. Every later prompt bakes that framing in. |
| `f7ac1b74-11fa-44a0-b4f5-67f44de03e67` + `084cc877-6039-4504-8ea6-248dcfc1afe6` | Voxel Arcade take 1: no Shift-9 branding on the cabinet. |
| `3a353f68-ee83-443f-8435-3490f5a3f376` | Voxel Arcade take 2: the marquee rendered as a separate sign hung on the brick wall instead of the cabinet's own header. Ask for a built-in header flush with the cabinet body, same width, no gap, nothing mounted on the wall. |
| `c0236258-5dbd-4dbf-9f84-92f099a6a4cb` | Smoke. The fluid rendered as vapour rather than liquid, and two haze wisps drifted in the black outside the glass. Every later video prompt now forbids smoke/haze/mist/fog by name and asks for sharp-edged liquid ribbons — glowing ink in water, not gas. |

**Still to shoot:** 06 Midnight Return · 07 Game Design Forge · 08 Neon Forge →
Titanium Forge Pro · 09 INSTRUMENT · 10 Automation Systems · 11 Omni-3D ·
12 WinFix. **03 Learning App artwork is supplied — never regenerate it.**

Ten plates left at 4 credits and eleven clips left at 8.75 (more if a set needs
10s, like Lumen's projection-mapping sequence) = **roughly 136 credits** to
finish the set.

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
