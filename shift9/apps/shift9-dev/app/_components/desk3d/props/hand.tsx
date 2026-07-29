"use client";

/* ────────────────────────────────────────────────────────────────────────
   THE HAND — placeholder. Deliberately, obviously, not the real thing.

   The real one is crocheted: ochre yarn in spiral stitch rows, a mitten shape
   with a thumb and a single rounded finger mass, a black knitted cuff at the
   wrist, no jewellery, forearm entering from the lower right. It is on screen
   in the film from 8.5s — 04-desk-mouse-screen-v5.mp4 at 9.35s is the clearest
   read of it. The whole room is made of crocheted fabric; a photoreal human
   hand dropped in here would destroy the one idea the world is built on.

   That hand gets modelled and rigged to follow the pointer later. This is four
   boxes and a cylinder standing where it will stand, so the rig has a mount
   point and the composite has something to prove depth against.

   It is flat-shaded and blocky ON PURPOSE. A half-nice hand is worse than an
   obvious placeholder: it invites notes on the modelling instead of notes on
   the thing this session is actually asking about, which is whether the
   desktop sits convincingly on the monitor.

   Colours are the film's own, sampled off the 9.35s frame and held as tokens
   (`--s9-yarn-ochre`, `--s9-yarn-cuff`) so the real hand inherits them.
   ──────────────────────────────────────────────────────────────────────── */

import { MOUSE_POSITION, type RoomPalette, type SceneProp } from "../scene";

/* Boxes only, and measured ones: a hand is about 90mm across the knuckles and
   the room is built in metres, so the placeholder is the right SIZE even
   though it is the wrong SHAPE. That is the useful half — it proves the depth
   and the scale of the composite, which is what this session is asking. The
   shape is left obviously wrong so nobody reviews it as a hand. */
export function PlaceholderHand({ palette }: { palette: RoomPalette }) {
  const { yarn, cuff } = palette;
  return (
    <group>
      {/* Palm, resting on top of the mouse — so it sits a mouse's height off
          the desk, not on it. */}
      <mesh position={[0, 0.036, 0]}>
        <boxGeometry args={[0.084, 0.026, 0.086]} />
        <meshStandardMaterial color={yarn} flatShading roughness={1} />
      </mesh>
      {/* The finger mass, forward and tipping down over the front of the
          mouse. One block, not five: the crocheted hand is a mitten, and
          splitting it into fingers here would be inventing detail the
          reference does not have. */}
      <mesh position={[-0.004, 0.028, -0.058]} rotation={[0.24, 0, 0]}>
        <boxGeometry args={[0.066, 0.019, 0.042]} />
        <meshStandardMaterial color={yarn} flatShading roughness={1} />
      </mesh>
      {/* Thumb, out to the left along the mouse's flank. */}
      <mesh position={[-0.048, 0.03, -0.012]} rotation={[0, 0.42, 0.22]}>
        <boxGeometry args={[0.042, 0.017, 0.02]} />
        <meshStandardMaterial color={yarn} flatShading roughness={1} />
      </mesh>
      {/* Wrist, dropping toward the mat as it leaves the mouse. */}
      <mesh position={[0.026, 0.03, 0.046]} rotation={[-0.18, 0, 0]}>
        <boxGeometry args={[0.05, 0.026, 0.046]} />
        <meshStandardMaterial color={yarn} flatShading roughness={1} />
      </mesh>
      {/* The knitted cuff, and the forearm leaving toward the lower right of
          frame the way it does in the film. A box, not a tube: an open-ended
          cylinder pointed anywhere near the camera reads as a hole, which is
          the one thing a placeholder must not do — it stops looking like a
          stand-in and starts looking like a bug. */}
      <mesh position={[0.058, 0.024, 0.074]} rotation={[0.05, -0.45, 0]}>
        <boxGeometry args={[0.05, 0.042, 0.05]} />
        <meshStandardMaterial color={cuff} flatShading roughness={1} />
      </mesh>
      {/* One box, not two: two dark blocks with a step between them read as
          debris on the mat rather than as an arm going somewhere. */}
      <mesh position={[0.104, 0.022, 0.12]} rotation={[0.05, -0.45, 0]}>
        <boxGeometry args={[0.044, 0.038, 0.1]} />
        <meshStandardMaterial color={cuff} flatShading roughness={1} />
      </mesh>
    </group>
  );
}

/* The prop record. `transform` is the only thing that places it in the room —
   the component above knows nothing about where it is. */
const hand: SceneProp = {
  id: "hand",
  label: "The studio's hand, on the mouse",
  Model: PlaceholderHand,
  transform: {
    position: MOUSE_POSITION,
    /* Turned so the fingers point away from camera and slightly left, and the
       forearm leaves frame to the lower right — matching the film. Positive,
       because a +Y rotation swings the prop's -Z (its fingers) toward -X. */
    rotation: [0, 0.34, 0],
  },
};

export default hand;
