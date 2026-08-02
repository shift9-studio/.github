"use client";

/* ────────────────────────────────────────────────────────────────────────
   THE HAND — the studio's crocheted hand, on the mouse.

   Modelled in code, headless, with the 3d-master-modeler pipeline:
   `shift9/scripts/build-crocheted-hand.py` owns this asset end to end and its
   header carries the full method. Do not hand-edit the .glb — change the
   script and rerun it.

   What it is, from the film's own frame at 9.35s: a DOLL'S hand in ochre
   crochet — four fingers and a thumb, each worked in the round as its own short
   stuffed tube, on a palm arched over the mouse. Not a mitten (the fused lobe
   was pass 1) and not a human hand: blunt domed fingertips, no nails, no
   knuckle creases, stitch rows running around every piece and brick-offset half
   a stitch per round the way real crochet sits.

   The whole world is crocheted fabric. A photoreal hand here would end it —
   which is the one thing this model may never drift toward.

   The sleeve is knitted rather than crocheted, and it is a garment rather than
   a texture: a ribbed band for the first 34mm off the wrist, then 306mm of
   chunky plain knit opening out toward the elbow, running off the edge of frame
   at every window the room admits so its open end is never on screen.

   The stitch lattice is a NORMAL MAP, not geometry: 4,608 triangles carry the
   silhouette and 512px of baked normal carries every stitch. That is why this
   is 167 KB and not two megabytes. Colours are the theme's own yarn tokens,
   baked in — change `--s9-yarn-ochre` / `--s9-yarn-cuff` and rerun the script.

   NOT YET RIGGED. It is a single static mesh posed where the film's hand
   rests. The armature that makes it follow the pointer is the next step, and
   the script has the bone-chain path ready for it.
   ──────────────────────────────────────────────────────────────────────── */

import { useGLTF } from "@react-three/drei";
import { DESK, MOUSE_POSITION, type RoomPalette, type SceneProp } from "../scene";

const HAND_MODEL = "/experience/models/crocheted-hand.glb";

export function CrochetedHand(_: { palette: RoomPalette }) {
  const { scene } = useGLTF(HAND_MODEL);
  return <primitive object={scene} />;
}

useGLTF.preload(HAND_MODEL);

/* The prop record. `transform` is the only thing that places it in the room —
   the component above knows nothing about where it is. */
const hand: SceneProp = {
  id: "hand",
  label: "The studio's hand, on the mouse",
  Model: CrochetedHand,
  transform: {
    /* ── ON the mouse, not beside it ──────────────────────────────────────
       `MOUSE_POSITION` is the mouse's FOOT — the point the desk plane was
       calibrated against — and a hand does not go there. It goes on the hump,
       which is a different place in all three axes.

       The hump was measured the same way everything else in this room was, off
       the plate: the mouse occupies plate x 1307–1437, y 812–915, and its long
       axis runs almost straight away from the camera. Unprojecting the top of
       the hump at the depth the desk puts it lands the offsets below. The
       origin is the WRIST, and the palm's underside is ~9mm below it, so the
       height is the hump's top plus that clearance rather than the hump itself.

         +X 0.024   the hump sits right of the foot the calibration used
         +Y 0.014   a mouse is ~47mm tall and the palm sits ON it, and the
                    model's own arch already lifts the wrist above the palm
         −Z 0.030   further into the room, onto the body rather than in front
       Dropping the origin straight onto `MOUSE_POSITION` buried the wrist under
       the desk and left the hand short of the mouse entirely; the first attempt
       at these offsets over-corrected and left it hovering above and behind the
       mouse instead. Both were found by screenshot, not by arithmetic. */
    position: [
      MOUSE_POSITION[0] + 0.024,
      DESK.height + 0.014,
      MOUSE_POSITION[2] - 0.030,
    ],
    /* Fingers over the mouse, forearm leaving frame to the right. Positive,
       because a +Y rotation swings the model's fingers toward -X and its
       forearm toward +X.

       ── Why this is now 0.62 and not 1.45 ────────────────────────────────
       The mouse points almost straight away from the camera, so a hand truly
       square on it wants to be near 0 here — and every earlier pass had to turn
       it most of the way to 90 degrees instead, because the forearm shared the
       hand's axis and had to be swung out of the way of its own palm. The hand
       ended up holding a mouse it was no longer pointing at.

       The wrist bend now lives in the model (`cuff_rings`), so the arm can
       leave to the right while the hand stays pointed down the mouse, and this
       number only has to do one job. 0.62 keeps all four fingers separated at
       the size the prop actually covers; past ~0.8 they overlap into two lobes
       again, and below ~0.4 the sleeve starts crowding the palm. Chosen by
       screenshotting a sweep in the room — the only place either failure is
       visible. */
    rotation: [0, 0.62, 0],
    /* Kariim's call: a bit bigger. The model is built at the true size the desk
       calibration derives (about 110mm across the spread grip) and this is the
       one place that measurement is deliberately overridden, because the
       character is a doll and a doll's hands are chunky relative to its world.
       Nothing downstream depends on the hand's true size, so it is a single
       reversible number here rather than a rebuild. */
    scale: 1.18,
  },
};

export default hand;
