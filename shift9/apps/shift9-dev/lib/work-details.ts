import type { Project } from "@shift9/ui";
import { projects } from "./work-data";

/**
 * Per-project copy for the /work/<slug> detail pages. The base facts (title,
 * role, year, tags, status, accent, teaser video) come from work-data.ts; this
 * layer adds the narrative — what the app is, and what it does. Keyed by the
 * same slug as the Work Wall tiles.
 */
export interface ProjectDetail {
  /** One-line positioning statement. */
  tagline: string;
  /** Overview paragraphs — what it is and who it's for. */
  overview: string[];
  /** The functions/features that define it. */
  features: { title: string; body: string }[];
  /** Stack / notable tech. */
  tech: string[];
  /** Optional outbound CTA (live site, repo, or in-app showcase). */
  external?: { label: string; href: string };
}

export const details: Record<string, ProjectDetail> = {
  "just-a-pinch": {
    tagline: "Every recipe you love in one place — then guided cooking to the plate.",
    overview: [
      "Just a Pinch is a smart recipe organizer and cooking companion. It pulls the recipes scattered across links, screenshots, and camera rolls into one searchable home, then walks you through actually cooking them.",
      "It's the studio's proof that we build our own products end to end — designed and shipped on the same INSTRUMENT system that runs shift9.dev, with a warm, appetite-first surface of its own.",
    ],
    features: [
      { title: "Capture anything", body: "Clip from a URL, snap a photo, or type your own. Every recipe lands in one tidy, searchable library instead of seventeen open tabs." },
      { title: "Smart swaps", body: "Out of buttermilk? It hands you the substitution before you panic-Google it mid-recipe." },
      { title: "Scaled to taste", body: "Quantities and timings recalculate themselves for one quiet dinner or a full table." },
      { title: "Cook mode", body: "Hands-free, step-by-step guidance that holds your place and times each stage." },
      { title: "Organize & search", body: "Tag and sort by ingredient, cuisine, or craving — the recipe you want is two taps away." },
      { title: "Cross-platform", body: "Live on web and Android today, with iOS on the way. Your library follows you." },
    ],
    tech: ["Next.js", "Supabase", "INSTRUMENT design system", "ISR"],
    external: { label: "Visit the live site ↗", href: "https://pinch.shift9.dev" },
  },

  "voxel-arcade-basketball": {
    tagline: "Pick-up-and-play arcade hoops in a destructible voxel world.",
    overview: [
      "Voxel Arcade Basketball is a fast, physics-driven take on arcade basketball set inside fully voxel arenas. The pitch is simple: easy to start, hard to put down, and every court is breakable.",
      "An in-development title built to ship on Steam, with the studio handling engineering, physics, and feel.",
    ],
    features: [
      { title: "Arcade-first controls", body: "Two-button shooting and dunking tuned for instant fun — no manual required." },
      { title: "Physics dunks", body: "Momentum-based jumps and rim physics make every poster-dunk feel earned." },
      { title: "Voxel arenas", body: "Courts built from voxels that chip, crack, and react to play." },
      { title: "Local & online", body: "Couch multiplayer and online matches for quick sessions." },
    ],
    tech: ["Python", "Custom voxel engine", "Steam"],
  },

  "recipe-engine": {
    tagline: "The content pipeline that quietly feeds Just a Pinch.",
    overview: [
      "Recipe Engine is the automation layer behind the product: it ingests recipes from the wild, normalizes them into one typed schema, and keeps the app's content fresh without a redeploy.",
      "A platform piece — invisible to users, essential to the product.",
    ],
    features: [
      { title: "Import & parse", body: "Pulls recipes from URLs and raw text and structures them into clean, typed records." },
      { title: "Ingredient tagging", body: "Auto-tags by ingredient, cuisine, and technique so search and swaps just work." },
      { title: "Supabase seeding", body: "Writes straight into the shared content store the apps read from." },
      { title: "Live revalidation", body: "Publish webhooks trigger ISR so updates appear near-instantly, no redeploy." },
    ],
    tech: ["Supabase", "TypeScript", "Webhooks", "ISR"],
  },

  "signal-grid": {
    tagline: "One token source, every surface on-brand.",
    overview: [
      "Signal Grid is the brand system that keeps the studio coherent: a single source of color, type, and spacing tokens that propagates to every surface — including the generated GitHub profile.",
      "Change a token once and the whole ecosystem repaints. No drift, no per-project guesswork.",
    ],
    features: [
      { title: "Token source of truth", body: "CSS-variable primitives → semantic aliases consumed everywhere." },
      { title: "Themeable accents", body: "Re-point one accent and every component re-skins for free." },
      { title: "Generated brand assets", body: "Branded SVGs render from the same tokens, light and dark." },
      { title: "Cross-surface sync", body: "Two Next.js apps and the markdown GitHub surface share one palette and type voice." },
    ],
    tech: ["CSS variables", "Tailwind v4 @theme", "SVG generation"],
  },

  instrument: {
    tagline: "The motion-first, cyber-brutalist system behind every Shift-9 surface.",
    overview: [
      "INSTRUMENT is the shared design foundation: colors, type scale, motion tokens, a component kit, and a live instrumentation layer that makes the chrome read like a precision console.",
      "It's the connective tissue of the whole studio — and it has a dedicated, interactive showcase.",
    ],
    features: [
      { title: "WebGL Dither hero", body: "A real-time ordered-dither shader that warps toward the cursor and reacts to scroll." },
      { title: "Proximity-weight type", body: "Variable-font weight and width respond to cursor distance and scroll velocity." },
      { title: "Magnetic interactions", body: "Spring-physics pull on buttons and tiles, with a docking custom cursor." },
      { title: "Reduced-motion contract", body: "One global switch collapses every effect to a calm resting frame." },
      { title: "Accessible by default", body: "A high-contrast focus system and a viewfinder reticle that augments it." },
    ],
    tech: ["Tailwind v4", "framer-motion", "WebGL / GLSL", "Lenis"],
    external: { label: "Explore the live showcase ↗", href: "/instrument" },
  },

  "dither-lab": {
    tagline: "A shader playground for the studio's signature dither field.",
    overview: [
      "Dither Lab is the R&D space where the INSTRUMENT hero was born: a sandbox for real-time dithering, cursor flowmaps, and palette experiments before they graduate into production.",
      "Research-grade work that keeps the studio's visual edge sharp.",
    ],
    features: [
      { title: "Real-time dithering", body: "Ordered Bayer / interleaved-gradient dither over animated noise, all on the GPU." },
      { title: "Cursor flowmaps", body: "Velocity-driven wakes and ripples that follow the pointer." },
      { title: "Palette re-skinning", body: "Colors arrive as uniforms, so any surface can recolor the field instantly." },
      { title: "Performance profiling", body: "dpr caps, offscreen pausing, and low-power contexts keep it GPU-light." },
    ],
    tech: ["WebGL", "GLSL", "Canvas"],
  },

  "midnight-return": {
    tagline: "A moody metroidvania about finding your way home in the dark.",
    overview: [
      "Midnight Return is a hand-tuned metroidvania: an interconnected world, ability-gated traversal, and platforming with weight and intent.",
      "In active development, with the studio leading engineering and game feel.",
    ],
    features: [
      { title: "Interconnected map", body: "A single continuous world that rewards exploration and backtracking." },
      { title: "Ability-gated traversal", body: "New movement abilities reopen old paths in new ways." },
      { title: "Tuned platforming", body: "Tight, readable controls with deliberate momentum." },
      { title: "Atmosphere first", body: "A dark, score-led mood that carries the journey." },
    ],
    tech: ["C#", "Custom tooling"],
  },

  "omni-3d": {
    tagline: "A TypeScript toolkit for shipping 3D on the web and in games.",
    overview: [
      "Omni-3D is an engineering toolkit that smooths the rough edges of cross-platform 3D: typed scene helpers, an asset pipeline, and primitives that travel between web and game runtimes.",
      "Built to make the studio's 3D work faster and more reliable.",
    ],
    features: [
      { title: "Typed scene helpers", body: "Strongly-typed APIs for building and managing 3D scenes." },
      { title: "Asset pipeline", body: "A consistent path from source assets to runtime-ready meshes and textures." },
      { title: "Cross-runtime primitives", body: "Shared building blocks that work across web and game engines." },
    ],
    tech: ["TypeScript", "3D", "Game dev"],
    external: { label: "View on GitHub ↗", href: "https://github.com/shift9-studio" },
  },

  "sub-scraper": {
    tagline: "Pull your library and subscriptions across music platforms.",
    overview: [
      "Sub Scraper is an automation tool that consolidates your music presence — syncing libraries and playlists across Spotify and SoundCloud, and exporting them where you need.",
      "A focused utility born from a real itch: your music, in your control.",
    ],
    features: [
      { title: "Multi-platform sync", body: "Reads from Spotify and SoundCloud in one pass." },
      { title: "Export playlists", body: "Get your playlists out in a portable format." },
      { title: "Dedupe", body: "Collapses duplicate tracks across sources automatically." },
      { title: "Scheduled runs", body: "Set it to keep itself up to date." },
    ],
    tech: ["Python", "Spotify API", "SoundCloud"],
    external: { label: "View on GitHub ↗", href: "https://github.com/shift9-studio" },
  },

  "whome-diagnostic": {
    tagline: "A one-shot Windows health check.",
    overview: [
      "whome Diagnostic is a lightweight utility that runs a quick, readable health check on a Windows machine and hands back a clear report.",
      "Small, fast, and useful — the kind of tool you reach for when something feels off.",
    ],
    features: [
      { title: "System diagnostics", body: "Surveys the machine's health in a single run." },
      { title: "Readable report", body: "Plain-language output you can act on or hand off." },
      { title: "Export", body: "Save the report for support or your own records." },
      { title: "Lightweight", body: "No install footprint to speak of — run it and go." },
    ],
    tech: ["Python", "Windows"],
    external: { label: "View on GitHub ↗", href: "https://github.com/shift9-studio" },
  },
};

export interface ResolvedProject {
  project: Project;
  detail: ProjectDetail;
  index: number;
}

/** All project slugs that have both a tile and a detail entry. */
export const projectSlugs: string[] = projects
  .map((p) => p.slug)
  .filter((s): s is string => !!s && !!details[s]);

/** Resolve a slug to its base project + detail copy, or null if unknown. */
export function getProject(slug: string): ResolvedProject | null {
  const index = projects.findIndex((p) => p.slug === slug);
  const project = projects[index];
  const detail = details[slug];
  if (!project || !detail) return null;
  return { project, detail, index };
}
