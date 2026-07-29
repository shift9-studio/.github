"use client";

/* ────────────────────────────────────────────────────────────────────────
   THE HAND — the studio's crocheted hand, on the mouse.

   Modelled in code, headless, with the 3d-master-modeler pipeline:
   `shift9/scripts/build-crocheted-hand.py` owns this asset end to end and its
   header carries the full method. Do not hand-edit the .glb — change the
   script and rerun it.

   What it is, from the film at 9.1–10.0s: a crocheted MITTEN in ochre yarn,
   not a hand with fingers. Stitch rows run around it, brick-offset half a
   stitch per round the way real crochet sits. A separate thumb gusset leaves
   the notch the mouse shows through. The cuff is knitted rather than
   crocheted — coarser, ribbed along its length, near-black.

   The whole world is crocheted fabric. A photoreal hand here would end it.

   The stitch lattice is a NORMAL MAP, not geometry: 8,880 triangles carry the
   silhouette and 512px of baked normal carries every stitch. That is why this
   is 116 KB and not two megabytes. Colours are the theme's own yarn tokens,
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
    position: [MOUSE_POSITION[0] + 0.022, DESK.height + 0.030, MOUSE_POSITION[2] - 0.030],
    /* Fingers away from camera and slightly left, forearm leaving frame to the
       lower right — matching the film. Positive, because a +Y rotation swings
       the model's -Y (its fingers) toward -X. */
    rotation: [0, 0.46, 0],
  },
};

export default hand;
