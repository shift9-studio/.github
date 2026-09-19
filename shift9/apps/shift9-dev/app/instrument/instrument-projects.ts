type InstrumentProjectBase = {
  name: string;
  specimenLabel: string;
  headline: string;
  description: string;
  surfaceNote: string;
  action: string;
  image: string;
};

type InternalInstrumentProject = InstrumentProjectBase & {
  href: `/${string}`;
  external?: false;
};

type ExternalInstrumentProject = InstrumentProjectBase & {
  href: `https://${string}`;
  external: true;
};

export type InstrumentProject =
  | InternalInstrumentProject
  | ExternalInstrumentProject;

/**
 * Add one entry here after a project page is ready. Instrument will create the
 * specimen drawer and surface-voice row automatically; no page or CSS edit is
 * required. Images live under apps/shift9-dev/public and use root-relative URLs.
 */
export const instrumentProjects = [
  {
    name: "Shift-9 Studio",
    specimenLabel: "Specimen 01 / Studio",
    headline: "Precision for a working studio.",
    description:
      "A measured grid, technical labels, and restrained materials put the work ahead of decoration.",
    surfaceNote: "Measured, structural, and monochrome.",
    href: "/studio",
    action: "Enter the studio →",
    image: "/experience/opening/00-entry-seam.jpg",
  },
  {
    name: "Flow State",
    specimenLabel: "Specimen 02 / Flow State",
    headline: "Focus for private dictation.",
    description:
      "Titanium keeps the page quiet. A single holofoil mark carries product identity without turning the interface into a light show.",
    surfaceNote: "Quiet focus with one warm holofoil signal.",
    href: "/flow-state",
    action: "Open Flow State →",
    image: "/experience/set-pieces/02-flow-state.png",
  },
  {
    name: "Feelspoon",
    specimenLabel: "Specimen 03 / Feelspoon",
    headline: "Warmth for the kitchen.",
    description:
      "Editorial type, paper texture, and food-first language replace the studio chrome while the interaction rules stay intact.",
    surfaceNote: "Editorial warmth built around cooking.",
    href: "https://feelspoon.app",
    action: "Visit Feelspoon ↗",
    image: "/experience/set-pieces/01-just-a-pinch.png",
    external: true,
  },
] as const satisfies readonly InstrumentProject[];
