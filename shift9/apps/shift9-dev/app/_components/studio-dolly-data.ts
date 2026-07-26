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
  /* What the thing actually is and does, in plain language. Taken from the
     studio's own project data rather than written fresh, so the dolly and the
     desktop never describe the same project two different ways. */
  note: string;
  /* The real stack. Concrete nouns only — this is a spec line, not a badge
     collection. */
  tags: string[];
  plate: string;
  clip: string;
  /* Where the project actually lives, when it lives anywhere. */
  href?: string;
  /* A second destination, for projects that ship something you install rather
     than only something you visit. Just a Pinch has both: a marketing site and
     a web-app entrance carrying the Google Play download and the iOS notice.
     Sending people to the site when they want the app is a dead end. */
  appHref?: string;
  appLabel?: string;
  /* Each card is laid out after the thing it describes: a recipe card for the
     cooking app, a scoreboard for the basketball game, a terminal for the
     automation stack. Twelve variants of one system - the type scale, palette
     and spacing are shared, only the arrangement changes - so the set reads as
     a designed series rather than twelve unrelated slides. */
  card: CardVariant;
};

export type CardVariant =
  | "recipe"
  | "waveform"
  | "storybook"
  | "calibration"
  | "scoreboard"
  | "corridor"
  | "schematic"
  | "swatch"
  | "panel"
  | "terminal"
  | "wireframe"
  | "dialog";

const BASE = "/experience/set-pieces/";

export const SET_PIECES: SetPiece[] = [
  {
    n: "01",
    title: "Just a Pinch",
    /* In closed testing on Android until Kariim flips the switch. The desktop
       folder and this roster disagreed for a while - desktop said IN TESTING,
       the dolly said LIVE - and the desktop was right. */
    status: "IN TESTING",
    resolution: "resolved",
    note: "Smart recipe organizer and guided cooking app. Save from links, photos or scratch; cook mode scales servings and suggests swaps. The Recipe Engine behind it is a Supabase-backed pipeline that seeds and serves the catalog.",
    tags: ["React Native", "TypeScript", "Supabase", "Android \u00b7 iOS soon"],
    plate: `${BASE}01-just-a-pinch.png`,
    clip: `${BASE}01-just-a-pinch.mp4`,
    card: "recipe",
    href: "https://pinch.shift9.dev",
    appHref: "https://kariimc.github.io/Just-a-pinch/",
    appLabel: "Get the app",
  },
  {
    n: "02",
    title: "Flow State",
    status: "SHIPPING",
    resolution: "resolved",
    note: "Local voice-to-text dictation for Windows. Profiles, custom vocabulary, selected-text commands, history and crash recovery \u2014 dictation that stays on your machine.",
    tags: ["Python", "Whisper", "Windows", "Local-first"],
    plate: `${BASE}02-flow-state.png`,
    clip: `${BASE}02-flow-state-v2.mp4`,
    card: "waveform",
  },
  {
    n: "03",
    title: "Learning App",
    status: "SHIPPING",
    resolution: "resolved",
    note: "A children's reading tool that turns practice into play. Built for real kids, tested by real kids.",
    tags: ["Python", "Education", "Kids"],
    plate: `${BASE}03-learning-app.png`,
    clip: `${BASE}03-learning-app.mp4`,
    card: "storybook",
  },
  {
    n: "04",
    title: "Lumen Projection Mapper",
    status: "IN DEV",
    resolution: "volatile",
    note: "Point a projector at anything, drag the corners on your phone, and the image warps to fit. Projection mapping with zero jargon.",
    tags: ["JavaScript", "WebSockets", "Projection"],
    plate: `${BASE}04-lumen.png`,
    clip: `${BASE}04-lumen.mp4`,
    card: "calibration",
  },
  {
    n: "05",
    title: "Voxel Arcade Basketball",
    status: "IN DEV",
    resolution: "volatile",
    note: "Arcade basketball in Godot. Arena, broadcast camera, crowd shader bowl and player movement are live; ball physics and the box score are next.",
    tags: ["Godot", "GDScript", "3D"],
    plate: `${BASE}05-voxel-arcade-v3.png`,
    clip: `${BASE}05-voxel-arcade-v3.mp4`,
    card: "scoreboard",
    href: "/work/voxel-arcade-basketball",
  },
  {
    n: "06",
    title: "Midnight Return",
    status: "IN DEV",
    resolution: "volatile",
    note: "A metroidvania platformer in C#. Exploration-first design.",
    tags: ["C#", "Metroidvania"],
    plate: `${BASE}06-midnight-return.png`,
    clip: `${BASE}06-midnight-return.mp4`,
    card: "corridor",
  },
  {
    n: "07",
    title: "Game Design Forge",
    status: "R&D",
    resolution: "volatile",
    note: "A UE5 plugin suite that lets non-programmers assemble games LEGO-style: socket-matched auto-tiling, one-click destruction, and a tutorial overlay that watches what you do. Blueprint complete; build phase next.",
    tags: ["Unreal 5", "C++", "R&D"],
    plate: `${BASE}07-game-design-forge.png`,
    clip: `${BASE}07-game-design-forge-v2.mp4`,
    card: "schematic",
  },
  {
    n: "08",
    title: "Titanium Forge Pro",
    status: "IN DEV",
    resolution: "volatile",
    note: "A UI/UX component workbench: a dark-mode React component library with live demos and copyable snippets you can lift straight into a project. In active development.",
    tags: ["React", "TypeScript", "Design System", "Cloudflare"],
    plate: `${BASE}08-titanium-forge.png`,
    clip: `${BASE}08-titanium-forge.mp4`,
    card: "swatch",
  },
  {
    n: "09",
    title: "INSTRUMENT",
    status: "LIVE",
    resolution: "resolved",
    note: "The design system running shift9.dev and pinch.shift9.dev \u2014 tokens, motion, accessibility. Proof you can click.",
    tags: ["Tailwind v4", "Motion", "A11y"],
    plate: `${BASE}09-instrument.png`,
    clip: `${BASE}09-instrument.mp4`,
    card: "panel",
    href: "/instrument",
  },
  {
    n: "10",
    title: "Automation Systems",
    status: "LIVE",
    resolution: "resolved",
    note: "The infrastructure behind the studio: Relay for cross-machine state handoff, a 400+ skill control plane governing AI-assisted builds, and claude-eyes, a screen-capture toolkit that gives coding agents vision.",
    tags: ["Automation", "AI Agents", "Git", "Windows"],
    plate: `${BASE}10-automation-systems.png`,
    clip: `${BASE}10-automation-systems.mp4`,
    card: "terminal",
  },
  {
    n: "11",
    title: "Omni-3D",
    status: "IN DEV",
    resolution: "volatile",
    note: "A game-development toolkit in TypeScript.",
    tags: ["TypeScript", "3D", "Tooling"],
    plate: `${BASE}11-omni-3d.png`,
    clip: `${BASE}11-omni-3d.mp4`,
    card: "wireframe",
  },
  {
    n: "12",
    title: "WinFix",
    status: "SHIPPED",
    resolution: "resolved",
    note: "A Windows utility that repairs the Windows 10 Home upgrade bug. Small tool, real problem, done. Windows 11 support is on the roadmap.",
    tags: ["Python", "Windows", "Utility"],
    plate: `${BASE}12-winfix.png`,
    clip: `${BASE}12-winfix.mp4`,
    card: "dialog",
  },
];
