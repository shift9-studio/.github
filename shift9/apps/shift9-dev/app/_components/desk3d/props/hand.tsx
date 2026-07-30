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
    /* Modelled at true size in metres, so it needs no scaling — it is 108mm
       from wrist to fingertip because the film's hand measures 108mm at the
       depth the desk calibration puts the mouse at.

       Placed by its WRIST, which is where the model's origin is, not by its
       palm. Dropping the origin straight onto `MOUSE_POSITION` buried the
       wrist 13mm under the desk and left the mitten short of the mouse
       entirely — the offsets below sit it on top of the mouse instead:
         +Y   a mouse is ~42mm tall and the hand rests on it, not on the desk
         −Z   further into the room, so the mitten covers the mouse rather
              than stopping in front of it
         +X   the film's hand comes in from the right of the mouse's centre */
    position: [MOUSE_POSITION[0] + 0.004, DESK.height + 0.034, MOUSE_POSITION[2] + 0.004],
    /* Hand broadside to the camera, fingers to the left over the mouse, forearm
       leaving frame to the right — the pose the film's own frame at 9.35s
       shows. Positive, because a +Y rotation swings the model's fingers toward
       -X and its forearm toward +X.

       1.45 rather than the 0.98 of the first pass, and the difference is not
       taste. Below about 1.2 the forearm points too far AT the camera, and a
       tube coming at the lens foreshortens into a wedge that covered three of
       the four fingers — the fingers were fine, they were simply behind the
       arm. Above about 1.5 the arm runs exactly across the frame, loses all
       perspective and reads as a flat black bar. Chosen by screenshotting six
       values at the size it ships at, which is the only way to see either
       failure. */
    rotation: [0, 1.45, 0],
  },
};

export default hand;
