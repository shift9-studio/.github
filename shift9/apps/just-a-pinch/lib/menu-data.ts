import type { Project } from "@shift9/ui";

/**
 * The recipe collection reuses the studio's WorkWall — recipes mapped onto the
 * shared `Project` shape (title → dish, role → cuisine, year → time,
 * tags → key ingredients). In production these come from the same Supabase
 * content source as the app's featured recipes; here they're a static seed.
 */
export const board: Project[] = [
  {
    title: "Weeknight Miso Salmon",
    role: "Japanese · sheet-pan",
    year: "20 min",
    tags: ["salmon", "miso", "scallion"],
    accent: "signal",
    status: "fresh",
  },
  {
    title: "Pantry Puttanesca",
    role: "Italian · one-pot",
    year: "25 min",
    tags: ["tinned tomato", "olive", "caper"],
    accent: "pulse",
    status: "5 swaps",
  },
  {
    title: "Smoky Chickpea Stew",
    role: "Vegan · batch",
    year: "35 min",
    tags: ["chickpea", "paprika", "spinach"],
    accent: "signal",
    status: "fridge-clear",
  },
  {
    title: "Brown-Butter Banana Bread",
    role: "Bake · uses overripe",
    year: "1 hr",
    tags: ["banana", "brown butter", "walnut"],
    accent: "pulse",
    status: "rescue",
  },
  {
    title: "Crispy Gochujang Tofu",
    role: "Korean · air-fry",
    year: "30 min",
    tags: ["tofu", "gochujang", "honey"],
    accent: "signal",
    status: "spicy",
  },
  {
    title: "Lemon-Garlic Orzo",
    role: "Mediterranean · skillet",
    year: "22 min",
    tags: ["orzo", "lemon", "parmesan"],
    accent: "pulse",
    status: "fresh",
  },
];
