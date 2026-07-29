# Run-card — the studio's crocheted hand

Pipeline: `3d-master-modeler`. Asset: `shift9/apps/shift9-dev/public/experience/models/crocheted-hand.glb`.
Built by `shift9/scripts/build-crocheted-hand.py` (headless Blender 5.0.1, bpy from PyPI, Cycles CPU).

| Phase | Proof required | Artifact / value | Status |
|---|---|---|---|
| 0 — Intake & routing | One-line decision: framework, poly budget, deliverable format(s) | **Blender `bpy` headless → glTF**, because the target is an asset imported into an existing R3F scene, not a standalone web page. Budget ≤ ~4k tris for a prop covering ~180 screen px. Deliverable: `.glb` + proof renders. Scale is not chosen — the desk calibration puts the mouse 0.843m from camera, making the film's hand **104mm** wrist-to-fingertip. | ☑ |
| 1 — Blockout | Blockout render, dimensionally checked | `blockout_{front34,side,top}.png`. **Two corrections found by looking:** pass 1 rendered pure white (3-point rig at film-set energies on a 10cm object — 28W key → 5W) and came out **53mm thick** where a hand is 34mm. Pass 2 measured **83 × 108 × 44mm** against the reference's 84mm knuckles. | ☑ |
| 2 — Topology & refinement | Mesh audit: object + tri counts, non-manifold | `AUDIT: CrochetedHand quads=1176 ngons=5 non_manifold_edges=24 loose_verts=0`. Quad-dominant by construction — a lofted ring/spine tube, not booleaned primitives. The 5 ngons are flat end caps (tolerated); the 24 non-manifold edges are the cuff's **deliberately open** wrist end, where it sleeves over the hand. Shipped: **1,176 quads / 2,270 tris.** | ☑ |
| 3 — PBR materials | Material list + which Principled sockets were set | Three procedural materials: `Yarn` (30 rounds × 46 stitches), `YarnThumb` (15 × 20), `Cuff` (ribbed, 9 × 26). Sockets: Base Color (ColorRamp off the stitch height), Roughness (ColorRamp, 0.72–0.90 — never a constant), Normal (Bump off the stitch lattice), Metallic 0, Sheen Weight 0.08. **Two corrections:** Sheen at 0.35 desaturated the ochre to peach and lifted the near-black cuff to mid-grey; and the cuff's crochet lattice read as a quilted puffer jacket until it was switched to a rib. | ☑ |
| 3b — Photo-real textures | Texture sources + resolutions, or N/A + reason | **N/A — the target is stylised, not photo-real.** The whole world is crocheted fabric; the structure that has to read is the stitch lattice itself, and that is generated from the mesh's own UV grid (rows around the hand, brick-offset half a stitch per round) rather than sampled from a photograph of some other material. A Poly Haven fabric scan would have supplied micro-detail and destroyed the thing that makes it crochet. | ☑ |
| 4 — Lighting & camera | Environment/HDRI + lighting test render | 3-point rig scaled to a 10cm subject (key 5.0W warm / fill 1.2W cool / rim 3.5W), 50mm camera on a Track-To. **View transform forced to `Standard`** — Blender's default AgX rolled the saturated ochre off to pale peach for two passes while the material was correct, and judging albedo through a film curve bakes the wrong colour. | ☑ |
| 5 — Verification loop | Iteration count (≥2) + per-pass findings; final renders read with own eyes | **5 passes, every one read as an image, not assumed.** (1) blown-out white + 53mm thick → relit, reprofiled. (2) shape good, thumb a spike, cuff a bolster → thumb fattened, cuff slimmed. (3) peach not ochre → sRGB→linear conversion + sheen cut + AgX off. (4) cuff quilted → ribbed. (5) exported at subsurf 0 → cuff's flat end cap visible in frame → forearm extended to 200mm so it leaves frame. Renders: `final_*`, `glb_*`. | ☑ |
| Delivery | Export file(s) + sizes + one-line rationale | **`crocheted-hand.glb`, 149 KB**, 2,270 tris, one material, two 512px maps (albedo + normal, JPEG q82). **Not Draco-compressed on purpose:** Draco took it to 116 KB and then needed a decoder three.js fetches from a Google CDN — a third-party request on the entrance's critical path that fails behind any strict CSP, and self-hosting the decoder costs ~90 KB to save 33 KB on a mesh this small. Verified by re-importing the shipped `.glb` into an empty scene and rendering it (`verify_glb.py`) — the stitch lattice survives as a baked normal map with no node graph present. | ☑ |

## Known, and stated rather than hidden

- **Not rigged.** A single static mesh posed where the film's hand rests. The
  armature that makes it follow the pointer is the next step; the skill's
  bone-chain path (Template I) is what it will use.
- **The pose reads foreshortened in the shipped framing.** The room's camera
  sits 12° above the desk and the hand points away-left, so the mitten's width
  is compressed and the forearm — which runs toward the camera — is the
  largest thing in that corner. It is faithful to the film's own composition,
  but whether it is the composition the room wants is an art-direction call,
  not a modelling one. The pose is one `rotation` in `props/hand.tsx`.
- **The stitch scale is a judgement.** 30 rounds × 46 stitches is ~3.5mm per
  stitch, read off the film. At the ~180px the prop covers it reads as knitted
  fabric; at a closer framing it would want more rounds.
