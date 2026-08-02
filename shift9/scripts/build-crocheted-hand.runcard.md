# Run-card — the studio's crocheted hand

> **Revision 4.** Kariim: *"make the hand a bit bigger and lighter, refine the
> texture, and make the positioning natural — actually have him hold the mouse
> like you would in real life."* Revision 3 had a hand that was *near* the mouse;
> this one grips it, using a palm grip taken off ergonomics references rather
> than off the film, which only ever shows the hand from one angle.
>
> Revisions 1–3, for the record: 1 was a fused mitten; 2 gave it four
> worked-in-the-round digits plus a thumb; 3 arched the palm and rebuilt the
> sleeve as a garment.

Pipeline: `3d-master-modeler`. Asset: `shift9/apps/shift9-dev/public/experience/models/crocheted-hand.glb`.
Built by `shift9/scripts/build-crocheted-hand.py` (headless Blender 5.0.1, bpy from PyPI, Cycles CPU).

| Phase | Proof required | Artifact / value | Status |
|---|---|---|---|
| 0 — Intake & routing | One-line decision: framework, poly budget, deliverable format(s) | **Blender `bpy` headless → glTF**, because the target is an asset imported into an existing R3F scene, not a standalone web page. Budget ≤ ~5k tris for a prop covering ~180 screen px. Deliverable: `.glb` + proof renders. Scale is not chosen — the desk calibration puts the mouse 0.843m from camera, making the film's hand **104mm** wrist-to-fingertip. | ☑ |
| 1 — Blockout | Blockout render, dimensionally checked | `blockout_{front34,side,top}.png`. **Two corrections found by looking:** pass 1 rendered pure white (3-point rig at film-set energies on a 10cm object — 28W key → 5W) and came out **53mm thick** where a hand is 34mm. Pass 2 measured **83 × 108 × 44mm** against the reference's 84mm knuckles. | ☑ |
| 2 — Topology & refinement | Mesh audit: object + tri counts, non-manifold | `AUDIT: CrochetedHand quads=2304 ngons=13 non_manifold_edges=24 loose_verts=0 dims=0.345×0.325×0.077m` (the box is wide because the forearm now leaves the hand at a 50° wrist bend rather than running back along its own axis). Quad-dominant by construction — every piece is a lofted ring/spine tube, not booleaned primitives, and each ring is framed off its own local tangent so a digit aimed sideways still gets round cross-sections. The 13 ngons are flat end caps (tolerated); the 24 non-manifold edges are the cuff's **deliberately open** wrist end, where it sleeves over the hand. Shipped: **2,304 quads / 4,608 tris.** | ☑ |
| 3 — PBR materials | Material list + which Principled sockets were set | Seven procedural materials, each with its stitch counts scaled to its own piece so a stitch stays the right physical size everywhere: `Yarn` palm (14 rounds × 30), `YarnThumb` (9 × 13), `YarnFinger1-4` (7 × 10 each), `Cuff` (17 × 9, ribbed for the first 10% of its length then plain knit). One shared material would have put 46 stitches around a 16mm fingertip. Sockets: Base Color (ColorRamp off the stitch height), Roughness (ColorRamp, 0.72–0.90 — never a constant), Normal (Bump off the stitch lattice), Metallic 0, Sheen Weight 0.08. The crochet height field is deliberately **row-biased** (`dome_row^0.40`, weighted 0.56/0.44 against the per-stitch dome) — weight the two equally and it comes out as basketweave, which is quilting, not crochet. **Four corrections:** Sheen at 0.35 desaturated the ochre to peach and lifted the near-black cuff to mid-grey; the cuff's crochet lattice read as a quilted puffer jacket until it was switched to a rib; and then the rib, run the full length of the forearm, read as **corrugated hose** until it was cut back to a band; and the first row-bias attempt (0.55) was not enough to kill the quilted look. | ☑ |
| 3b — Photo-real textures | Texture sources + resolutions, or N/A + reason | **N/A — the target is stylised, not photo-real.** The whole world is crocheted fabric; the structure that has to read is the stitch lattice itself, and that is generated from the mesh's own UV grid (rows around the hand, brick-offset half a stitch per round) rather than sampled from a photograph of some other material. A Poly Haven fabric scan would have supplied micro-detail and destroyed the thing that makes it crochet. | ☑ |
| 4 — Lighting & camera | Environment/HDRI + lighting test render | 3-point rig scaled to a 10cm subject (key 5.0W warm / fill 1.2W cool / rim 3.5W), 50mm camera on a Track-To. **View transform forced to `Standard`** — Blender's default AgX rolled the saturated ochre off to pale peach for two passes while the material was correct, and judging albedo through a film curve bakes the wrong colour. **The room has its own rig** and revision 3 changed it: see phase 5, pass 13. | ☑ |
| 5 — Verification loop | Iteration count (≥2) + per-pass findings; final renders read with own eyes | **17 passes, every one read as an image, not assumed** — and from pass 10 on, read *in the room at the size it ships at*, not in the beauty render. (1) blown-out white + 53mm thick → relit, reprofiled. (2) shape good, thumb a spike, cuff a bolster → thumb fattened, cuff slimmed. (3) peach not ochre → sRGB→linear conversion + sheen cut + AgX off. (4) cuff quilted → ribbed. (5) exported at subsurf 0 → cuff's flat end cap visible in frame → forearm extended to 200mm. (6) rebuilt as a doll hand with four fingers + thumb. (7) the thumb rendered as a flat blade — the loft was laying every cross-section in a fixed plane, wrong for any digit not aimed along the spine axis; rings are now framed off the local tangent. (8) fingers hid behind the palm → hand turned. (9) finger tube ends showed at the knuckles → roots buried 11mm into the palm. (10) fingertips read as cut tubes → profiles closed to 1.4mm and segment count raised. (11) **the ribbed forearm read as corrugated hose** → rib cut to a 34mm band at the wrist, plain chunky knit past it, gauge coarsened from 7mm to 20mm stitches against the film's own frame. (12) the forearm's open end was still on screen at 1920×1080 → lengthened to 340mm, verified off-frame at five sizes including the widest the room admits. (13) **three of four fingers were hidden behind the forearm** — nothing wrong with the fingers, the hand simply had nowhere to be: the palm was flat where the film's is arched over the mouse. 18mm of arch added, digit roots re-read off the same curve so they cannot drift out of step, and the prop's Y rotation chosen by screenshotting six values in the room. (14) the hand was *near* the mouse rather than on it — `MOUSE_POSITION` is the mouse's FOOT and the palm goes on its hump, which is a different place in all three axes; hump measured off the plate (x 1307–1437, y 812–915) and the offsets unprojected from it. (15) **the pose was a hand resting, not holding** — all four fingers fanned forward with the same gentle curl. Rebuilt as a palm grip off ergonomics references: index and middle onto the buttons, ring and pinky turning down the right flank, thumb gripping the left. (16) pushing the curl to make it grip took the digits round far enough to meet their own knuckles — the hand rendered as **two fat hooks with no palm**, a croissant. Curl pulled back to ~a third of finger length and the digits slimmed from 17.6mm to 13.6mm across, which is what stopped them merging into one lobe. (17) the palm was still hidden behind the forearm at every prop rotation tried — because the forearm shared the hand's axis, so it sat directly between the camera and the palm. **A wrist bend went into the model** (50°, past human, stated as such), which is what finally let the prop's own rotation drop from 1.45 to 0.62 and the hand point down the mouse it is holding. Renders: `final_*`, `glb_*`; room shots in the PR. | ☑ |
| Delivery | Export file(s) + sizes + one-line rationale | **`crocheted-hand.glb`, 167 KB**, 4,608 tris (seven pieces: palm, four fingers, thumb, cuff), one material, two 512px maps (albedo + normal, JPEG q82). **Not Draco-compressed on purpose:** Draco took it to 116 KB and then needed a decoder three.js fetches from a Google CDN — a third-party request on the entrance's critical path that fails behind any strict CSP, and self-hosting the decoder costs ~90 KB to save 33 KB on a mesh this small. Verified by re-importing the shipped `.glb` into an empty scene and rendering it (`verify_glb.py`), and by reading the shipped file's own baked albedo back out: the yarn bakes to the lifted ochre and the cuff to `#111113`, i.e. the theme's tokens, not a swatch. | ☑ |

## The room's lighting changed with it, and that is part of this asset

The forearm rendered as a **featureless black slab** in the room while looking
correct in the beauty render. The model was not the problem: the room's only two
lights — the wall's ambient bounce and the desk lamp — both sit *deeper in the
room than the props do*, so the nearest object to the camera was lit exclusively
along its top edge.

What was missing is the obvious thing: **the monitor.** A metre of bright surface
pointed straight at the desk, and the brightest object in the room by a
distance. `DeskScene` now carries it (`--s9-room-screen`, sampled off the
composited desktop's own wallpaper) plus a dim bounce off the room behind the
viewer. Neither can touch the plate — the backdrop is `meshBasicMaterial` and so
unlit by construction — so this only ever affects props.

## Known, and stated rather than hidden

- **Not rigged.** A single static mesh posed on the mouse. The armature that
  makes it follow the pointer is the next step; the skill's bone-chain path
  (Template I) is what it will use.
- **The wrist bends 50°, and a human wrist does about 30.** This is the one
  deliberately non-anatomical number in the model and it is load-bearing: the
  forearm is a 60mm tube pointing at the lens and the whole hand is 110mm, so
  with the arm on the hand's own axis the sleeve covers the palm from every
  angle. Three passes tried to solve that by rotating the whole prop, and each
  one bought a visible palm by turning the hand off the mouse it is meant to be
  holding. The character is crocheted and its wrist is a piece of fabric.
- **The hand ships 18% larger than the calibration says it should be.** The desk
  solve makes the film's hand 110mm across; `props/hand.tsx` scales it to ~130mm
  on Kariim's call. Doll, not person. One number, reversible.
- **The forearm is 340mm**, long for a forearm on a 110mm hand, and deliberate:
  the tube is open at the elbow end, every millimetre past the frame edge is
  invisible, and the alternative is a visible flat cap. Verified off-frame at
  the widest window the room admits (2:1) and the narrowest (16:10).
- **The sleeve stays dark in the room** even with the monitor lighting it. Not a
  defect — a near-black knit (`--s9-yarn-cuff`) in a dim room, backlit by the
  only bright thing in it. The knit reads along the top and upper face; the near
  face is genuinely in shadow.
- **The mouse is almost completely covered by the hand.** That is what a palm
  grip does, and it is worth naming because the mouse is a photograph: only its
  left edge and a sliver of its base still show. If it should read more, the
  hand moves, not the mouse.
- **The stitch scale is a judgement.** ~5mm per stitch on the hand and ~20mm on
  the sleeve, both read off the film's frame at 9.35s. At the ~180px the prop
  covers in the room it reads as crochet; much closer in, the hand's per-stitch
  dome would want to be rounder than it is.
