/**
 * Minimal row types for the columns the marketing surfaces actually read.
 * (The full app schema is far larger; we type only the public, read-only
 * slice consumed by the landing pages.)
 */

/** A row of the public `featured_recipes` content table. */
export interface FeaturedRecipeRow {
  title: string;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  prep_minutes: number;
  cook_minutes: number;
  difficulty: string | null;
  featured_rank: number | null;
  featured_date: string;
}
