# Run-card — the studio's crocheted hand

> **Revision 2.** Kariim's direction: it is a DOLL'S hand *with real fingers*,
> and it must not read as a real hand in a knitted glove. Revision 1 was a
> fused mitten; the fingers are now four separate worked-in-the-round digits
> plus a fatter thumb, at deliberately doll-like proportions.

Pipeline: `3d-master-modeler`. Asset: `shift9/apps/shift9-dev/public/experience/models/crocheted-hand.glb`.
Built by `shift9/scripts/build-crocheted-hand.py` (headless Blender 5.0.1, bpy from PyPI, Cycles CPU).

| Phase | Proof required | Artifact / value | Status |
|---|---|---|---|
| 0 — Intake & routing | One-line decision: framework, poly budget, deliverable format(s) | **Blender `bpy` headless → glTF**, because the target is an asset imported into an existing R3F scene, not a standalone web page. Budget ≤ ~4k tris for a prop covering ~180 screen px. Deliverable: `.glb` + proof renders. Scale is not chosen — the desk calibration puts the mouse 0.843m from camera, making the film's hand **104mm** wrist-to-fingertip. | ☑ |
| 1 — Blockout | Blockout render, dimensionally checked | `blockout_{front34,side,top}.png`. **Two corrections found by looking:** pass 1 rendered pure white (3-point rig at film-set energies on a 10cm object — 28W key → 5W) and came out **53mm thick** where a hand is 34mm. Pass 2 measured **83 × 108 × 44mm** against the reference's 84mm knuckles. | ☑ |
| 2 — Topology & refinement | Mesh audit: object + tri counts, non-manifold | `AUDIT: CrochetedHand quads=1824 ngons=13 non_manifold_edges=24 loose_verts=0`. Quad-dominant by construction — every piece is a lofted ring/spine tube, not booleaned primitives, and each ring is framed off its own local tangent so a digit aimed sideways still gets round cross-sections. The 13 ngons are flat end caps (tolerated); the 24 non-manifold edges are the cuff's **deliberately open** wrist end, where it sleeves over the hand. Shipped: **1,824 quads / 3,700 tris.** | ☑ |
| 3 — PBR materials | Material list + which Principled sockets were set | Six procedural materials, each with its stitch counts scaled to its own piece so a stitch is the same physical ~5mm everywhere: `Yarn` palm (14 rounds × 30), `YarnThumb` (9 × 13), `YarnFinger1-4` (7 × 10 each), `Cuff` (ribbed, 9 × 26). One shared material would have put 46 stitches around a 16mm fingertip. Sockets: Base Color (ColorRamp off the stitch height), Roughness (ColorRamp, 0.72–0.90 — never a constant), Normal (Bump off the stitch lattice), Metallic 0, Sheen Weight 0.08. **Two corrections:** Sheen at 0.35 desaturated the ochre to peach and lifted the near-black cuff to mid-grey; and the cuff's crochet lattice read as a quilted puffer jacket until it was switched to a rib. | ☑ |
| 3b — Photo-real textures | Texture sources + resolutions, or N/A + reason | **N/A — the target is stylised, not photo-real.** The whole world is crocheted fabric; the structure that has to read is the stitch lattice itself, and that is generated from the mesh's own UV grid (rows around the hand, brick-offset half a stitch per round) rather than sampled from a photograph of some other material. A Poly Haven fabric scan would have supplied micro-detail and destroyed the thing that makes it crochet. | ☑ |
| 4 — Lighting & camera | Environment/HDRI + lighting test render | 3-point rig scaled to a 10cm subject (key 5.0W warm / fill 1.2W cool / rim 3.5W), 50mm camera on a Track-To. **View transform forced to `Standard`** — Blender's default AgX rolled the saturated ochre off to pale peach for two passes while the material was correct, and judging albedo through a film curve bakes the wrong colour. | ☑ |
| 5 — Verification loop | Iteration count (≥2) + per-pass findings; final renders read with own eyes | **9 passes, every one read as an image, not assumed.** (1) blown-out white + 53mm thick → relit, reprofiled. (2) shape good, thumb a spike, cuff a bolster → thumb fattened, cuff slimmed. (3) peach not ochre → sRGB→linear conversion + sheen cut + AgX off. (4) cuff quilted → ribbed. (5) exported at subsurf 0 → cuff's flat end cap visible in frame → forearm extended to 200mm so it leaves frame. (6) rebuilt as a doll hand with four fingers + thumb. (7) the thumb rendered as a flat blade — the loft was laying every cross-section in a fixed plane, which is wrong for any digit not aimed along the spine axis; rings are now framed off the local tangent. (8) in the room the fingers hid behind the palm → hand turned to point across frame, as the film's does. (9) finger tube ends showed at the knuckles → roots buried 11mm into the palm. Renders: `final_*`, `glb_*`. | ☑ |
| Delivery | Export file(s) + sizes + one-line rationale | **`crocheted-hand.glb`, 193 KB**, 3,700 tris (six pieces: palm, four fingers, thumb, cuff), one material, two 512px maps (albedo + normal, JPEG q82). **Not Draco-compressed on purpose:** Draco took it to 116 KB and then needed a decoder three.js fetches from a Google CDN — a third-party request on the entrance's critical path that fails behind any strict CSP, and self-hosting the decoder costs ~90 KB to save 33 KB on a mesh this small. Verified by re-importing the shipped `.glb` into an empty scene and rendering it (`verify_glb.py`) — the stitch lattice survives as a baked normal map with no node graph present. | ☑ |

## Known, and stated rather than hidden

- **Not rigged.** A single static mesh posed where the film's hand rests. The
  armature that makes it follow the pointer is the next step; the skill's
  bone-chain path (Template I) is what it will use.
- **Two fingertip caps read as cut tube ends** in the room's raking light —
  the dome's end face turns away from the key and goes black, so it reads as a
  hole rather than a tip. Cosmetic, visible only on the two leftmost digits,
  and the fix is a rounder tip profile rather than a flat cap.
- **The pose is set by one `rotation` in `props/hand.tsx`.** It is currently
  turned to point the digits across frame, because at the room's 12° camera a
  hand pointing away hides its own fingers behind the palm. That is a framing
  choice and reversible in one number.
- **The stitch scale is a judgement.** ~5mm per stitch, read off the film,
  which is deliberately chunkier than revision 1's 3.5mm — that finer lattice
  read as machine knit rather than something worked by hand. At the ~180px the
  prop covers in the room it reads as crochet; closer in it would want more
  rounds and a rounder per-stitch dome (it currently tends toward basketweave).
