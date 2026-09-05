/* ────────────────────────────────────────────────────────────────────────
   ONE TYPEFACE PAIR PER PROJECT.

   The dolly already gives every project its own card layout — a recipe card
   for the cooking app, a scoreboard for the arcade game, a system dialog for
   the Windows utility. A shared typeface across all twelve undoes half of
   that: the arrangement changes but the voice never does, so the set still
   reads as one template twelve times.

   Each project now carries its own display face, chosen for what the thing
   actually is, and a reading face chosen to sit under it. The pairing travels
   with the roster as data — the same way the card variant does — so it is a
   property of the project rather than a decision buried in markup.

   On the reading faces: there are four, not twelve. A display face is the
   voice and has to be distinct; a text face's job is to disappear, and twelve
   different ones would be noise for the reader and roughly a quarter of a
   megabyte for the browser. Each is matched to its display face by
   proportion, not picked at random.

   Weight: these load only on /studio, and next/font self-hosts and subsets
   each one. Say the word if you want it trimmed — the honest lever is fewer
   display faces, not fewer weights.
   ──────────────────────────────────────────────────────────────────────── */

import {
  Archivo,
  Bungee,
  Chakra_Petch,
  Fraunces,
  IBM_Plex_Sans,
  JetBrains_Mono,
  Michroma,
  Nunito,
  Baloo_2,
  Space_Grotesk,
  Syne,
  Familjen_Grotesk,
  Saira_Condensed,
} from "next/font/google";
/* The house display and text faces, reused rather than re-loaded. Every
   next/font call is another self-hosted file; calling a family twice
   downloads it twice. */
import { display as bricolage, text as instrument } from "../fonts";

/* next/font requires literal option objects — the loader reads them at build
   time, so a spread or a shared constant is a build error, not a style choice.
   Hence the repetition below. */

/* ── The reading faces ─────────────────────────────────────────────────── */
const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500"], preload: false, display: "swap" });
const nunito = Nunito({ subsets: ["latin"], preload: false, display: "swap" });

/* ── The display faces, one per project ────────────────────────────────── */
/* 01 · warm, edible */
const fraunces = Fraunces({ subsets: ["latin"], axes: ["SOFT", "WONK"], preload: false, display: "swap" });
/* 02 · signal processing */
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], preload: false, display: "swap" });
/* 03 · soft, for children */
const baloo = Baloo_2({ subsets: ["latin"], preload: false, display: "swap" });
/* 04 · instrument panel */
const saira = Saira_Condensed({ subsets: ["latin"], weight: ["600", "700"], preload: false, display: "swap" });
/* 05 · arcade cabinet marquee */
const bungee = Bungee({ subsets: ["latin"], weight: "400", preload: false, display: "swap" });
/* 06 · strange, nocturnal */
const syne = Syne({ subsets: ["latin"], preload: false, display: "swap" });
/* 07 · engineering R&D */
const chakra = Chakra_Petch({ subsets: ["latin"], weight: ["600", "700"], preload: false, display: "swap" });
/* 08 · a design system */
const familjen = Familjen_Grotesk({ subsets: ["latin"], preload: false, display: "swap" });
/* 10 · the terminal */
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["700"], preload: false, display: "swap" });
/* 11 · 3D viewport chrome */
const michroma = Michroma({ subsets: ["latin"], weight: "400", preload: false, display: "swap" });
/* 12 · plain system utility. One instance serves both roles on this card -
   Archivo is the display face and the reading face, which is the joke: the
   dialog card only works if the type is honest. */
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], preload: false, display: "swap" });

export type ProjectFont = { display: string; text: string };

/* Keyed by the roster's own number so the pairing cannot drift out of sync
   with the order of the take. */
export const PROJECT_FONTS: Record<string, ProjectFont> = {
  /* Just a Pinch — a recipe app. Fraunces' soft, slightly wonky serif is the
     one face here that reads as a kitchen rather than a console. */
  "01": { display: fraunces.style.fontFamily, text: instrument.style.fontFamily },
  /* Flow State — speech into text, locally. Space Grotesk's clipped terminals
     read as signal processing without shouting about it. */
  "02": { display: spaceGrotesk.style.fontFamily, text: instrument.style.fontFamily },
  /* Learning App — early reading, for children. Baloo's rounded forms are the
     only correct answer; a grotesque here would be for the parents. */
  "03": { display: baloo.style.fontFamily, text: nunito.style.fontFamily },
  /* Lumen — projection mapping. Saira Condensed is instrument-panel type:
     narrow, upright, made for reading off a rig in the dark. */
  "04": { display: saira.style.fontFamily, text: plex.style.fontFamily },
  /* Voxel Arcade Basketball — Bungee is literally signage type, which is what
     a cabinet marquee is. */
  "05": { display: bungee.style.fontFamily, text: instrument.style.fontFamily },
  /* Midnight Return — a metroidvania. Syne is strange and slightly off-axis;
     it reads nocturnal rather than gothic, which is the right register. */
  "06": { display: syne.style.fontFamily, text: instrument.style.fontFamily },
  /* Game Design Forge — UE5 R&D. Chakra Petch's chamfered corners are drawn
     from technical lettering. */
  "07": { display: chakra.style.fontFamily, text: plex.style.fontFamily },
  /* Titanium Forge Pro — a component workbench. Familjen Grotesk is a
     designer's grotesque: neutral enough to be a system, characterful enough
     to be a choice. */
  "08": { display: familjen.style.fontFamily, text: instrument.style.fontFamily },
  /* INSTRUMENT — the design system this site is built on, so it gets the
     house face. The one project where sharing the studio's voice is correct. */
  "09": { display: bricolage.style.fontFamily, text: instrument.style.fontFamily },
  /* Automation Systems — agents and git. The title is set in the terminal
     face because the product is a terminal. */
  "10": { display: jetbrains.style.fontFamily, text: plex.style.fontFamily },
  /* Omni-3D — Michroma is wide, geometric and mechanical: viewport chrome. */
  "11": { display: michroma.style.fontFamily, text: instrument.style.fontFamily },
  /* WinFix — a small Windows utility that fixes one bug. Archivo is plain on
     purpose. The joke of the dialog card only works if the type is honest. */
  "12": { display: archivo.style.fontFamily, text: archivo.style.fontFamily },
};
