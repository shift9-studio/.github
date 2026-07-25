/* ────────────────────────────────────────────────────────────────────────
   THE TWELVE — transcribed from docs/STUDIO-DOLLY.md, which is locked.

   Roster, order and status are fixed there: no additions, no reordering, no
   status upgrades. If this file and that document disagree, that document
   wins. Status is not decoration — it drives the treatment, so it is data
   rather than a class name chosen at the call site.
   ──────────────────────────────────────────────────────────────────────── */

/* Resolved sets are pristine and settled; unresolved ones are raw and
   volatile. Every status in the roster maps to one of the two. */
export type Resolution = "resolved" | "volatile";

export type SetPiece = {
  n: string;
  title: string;
  status: string;
  resolution: Resolution;
  /* One plain line: what the set is. No superlatives. */
  note: string;
  plate: string;
  clip: string;
  /* Where the project actually lives, when it lives anywhere. */
  href?: string;
};

const BASE = "/experience/set-pieces/";

export const SET_PIECES: SetPiece[] = [
  {
    n: "01",
    title: "Just a Pinch",
    status: "LIVE",
    resolution: "resolved",
    note: "A recipe app. Surgically lit white counter, the live interface on a tablet.",
    plate: `${BASE}01-just-a-pinch.png`,
    clip: `${BASE}01-just-a-pinch.mp4`,
    href: "https://pinch.shift9.dev",
  },
  {
    n: "02",
    title: "Flow State",
    status: "SHIPPING",
    resolution: "resolved",
    note: "A clear vessel holding glowing blue fluid in laminar flow, lit for refraction.",
    plate: `${BASE}02-flow-state.png`,
    clip: `${BASE}02-flow-state-v2.mp4`,
  },
  {
    n: "03",
    title: "Learning App",
    status: "SHIPPING",
    resolution: "resolved",
    note: "An early-reading app. A warm reading nook with three crocheted plush animals.",
    plate: `${BASE}03-learning-app.png`,
    clip: `${BASE}03-learning-app.mp4`,
  },
  {
    n: "04",
    title: "Lumen Projection Mapper",
    status: "IN DEV",
    resolution: "volatile",
    note: "Projection mapping onto stacked boxes. The calibration grid fights before it locks.",
    plate: `${BASE}04-lumen.png`,
    clip: `${BASE}04-lumen.mp4`,
  },
  {
    n: "05",
    title: "Voxel Arcade Basketball",
    status: "IN DEV",
    resolution: "volatile",
    note: "An arcade cabinet running pixel-art C#, flickering neon blue and orange.",
    plate: `${BASE}05-voxel-arcade-v3.png`,
    clip: `${BASE}05-voxel-arcade-v3.mp4`,
    href: "/work/voxel-arcade-basketball",
  },
  {
    n: "06",
    title: "Midnight Return",
    status: "IN DEV",
    resolution: "volatile",
    note: "An industrial corridor soundstage under flickering saturated blues and oranges.",
    plate: `${BASE}06-midnight-return.png`,
    clip: `${BASE}06-midnight-return.mp4`,
  },
  {
    n: "07",
    title: "Game Design Forge",
    status: "R&D",
    resolution: "volatile",
    note: "An R&D workbench. Raw C# and engine schematics on screen, soldering iron out.",
    plate: `${BASE}07-game-design-forge.png`,
    clip: `${BASE}07-game-design-forge-v2.mp4`,
  },
  {
    n: "08",
    title: "Neon Forge → Titanium Forge Pro",
    status: "V1 SHIPPED · V2 IN DEV",
    resolution: "volatile",
    note: "A steel structure. V1 resolved in neon; V2 a titanium press extruding white-hot geometry.",
    plate: `${BASE}08-titanium-forge.png`,
    clip: `${BASE}08-titanium-forge.mp4`,
  },
  {
    n: "09",
    title: "INSTRUMENT",
    status: "LIVE",
    resolution: "resolved",
    note: "The design system running these sites. A brutalist synthesizer pulsing in blue.",
    plate: `${BASE}09-instrument.png`,
    clip: `${BASE}09-instrument.mp4`,
    href: "/instrument",
  },
  {
    n: "10",
    title: "Automation Systems",
    status: "LIVE",
    resolution: "resolved",
    note: "A data centre. One robotic arm performing a precise repeating assembly task.",
    plate: `${BASE}10-automation-systems.png`,
    clip: `${BASE}10-automation-systems.mp4`,
  },
  {
    n: "11",
    title: "Omni-3D",
    status: "IN DEV",
    resolution: "volatile",
    note: "A humanoid mech projected in air, unfinished — wireframe artifacts, missing geometry.",
    plate: `${BASE}11-omni-3d.png`,
    clip: `${BASE}11-omni-3d.mp4`,
  },
  {
    n: "12",
    title: "WinFix",
    status: "SHIPPED",
    resolution: "resolved",
    note: "A Windows repair tool. One resolved wrench-and-gear mark in a high-contrast room.",
    plate: `${BASE}12-winfix.png`,
    clip: `${BASE}12-winfix.mp4`,
  },
];
