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
  },
];
