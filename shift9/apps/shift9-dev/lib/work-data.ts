import type { Project } from "@shift9/ui";

/**
 * Static seed for the Work Wall. This is the exact shape returned by the
 * Supabase `projects` query (@shift9/data → getProjects()) in Phase 3 —
 * swapping the source is a one-line change, the wall doesn't care.
 */
export const projects: Project[] = [
  {
    title: "Just a Pinch",
    role: "Product · Design + Build",
    year: "2026",
    tags: ["iOS", "Recipes", "Supabase"],
    accent: "signal",
    status: "live",
  },
  {
    title: "Voxel Arcade Basketball",
    role: "Game · Engineering",
    year: "2025",
    tags: ["Steam", "Python", "Voxel"],
    accent: "pulse",
    status: "in dev",
  },
  {
    title: "Recipe Engine",
    role: "Platform · Automation",
    year: "2025",
    tags: ["Supabase", "API", "Seeding"],
    accent: "signal",
    status: "shipped",
  },
  {
    title: "Signal Grid",
    role: "Brand System",
    year: "2026",
    tags: ["Identity", "Tokens", "Web"],
    accent: "pulse",
    status: "shipped",
  },
  {
    title: "Instrument UI",
    role: "Design System",
    year: "2026",
    tags: ["Tailwind v4", "Motion", "A11y"],
    accent: "signal",
    status: "live",
  },
  {
    title: "Dither Lab",
    role: "R&D · WebGL",
    year: "2026",
    tags: ["Shaders", "GLSL", "Canvas"],
    accent: "pulse",
    status: "research",
    videoUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_3F1n9RqGZCJVrB84dvcvAMuNMRC/hf_20260625_141632_9d995ffb-e1cc-4e61-b3ca-18364a501448.mp4",
  },
  {
    title: "Midnight Return",
    role: "Game · Engineering",
    year: "2025",
    tags: ["C#", "Metroidvania", "Platformer"],
    accent: "pulse",
    status: "in dev",
  },
  {
    title: "Omni-3D",
    role: "Toolkit · Engineering",
    year: "2025",
    tags: ["TypeScript", "3D", "Game Dev"],
    accent: "signal",
    status: "in dev",
  },
  {
    title: "Sub Scraper",
    role: "Tool · Automation",
    year: "2025",
    tags: ["Python", "Spotify", "SoundCloud"],
    accent: "signal",
    status: "shipped",
  },
  {
    title: "whome Diagnostic",
    role: "Utility · Engineering",
    year: "2025",
    tags: ["Python", "Windows", "Diagnostic"],
    accent: "pulse",
    status: "shipped",
  },
];
