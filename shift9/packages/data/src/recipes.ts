import { getSupabase } from "./client";
import type { FeaturedRecipeRow } from "./types";

/**
 * A "Daily Board" tile — structurally compatible with the WorkWall's
 * `Project` shape, so featured recipes drop straight into the same brutalist
 * tile-plane the studio site uses for case studies. One component, two
 * surfaces.
 */
export interface BoardItem {
  title: string;
  role: string;
  year: string;
  tags: string[];
  accent: "signal" | "pulse";
  status: string;
}

function totalTime(prep: number, cook: number): string {
  const t = (prep || 0) + (cook || 0);
  if (t <= 0) return "quick";
  if (t < 60) return `${t} min`;
  const h = Math.floor(t / 60);
  const m = t % 60;
  return m ? `${h}h ${m}m` : `${h} hr`;
}

/**
 * The landing-page "Daily Board" — real featured recipes straight from the
 * Just-a-Pinch content table (public-read RLS, §5). Mapped onto the WorkWall
 * tile shape. Returns `null` when Supabase isn't configured (or the request
 * fails) so the page falls back to its static seed and never breaks a build.
 */
export async function getFeaturedBoard(
  limit = 6,
): Promise<BoardItem[] | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from("featured_recipes")
    .select(
      "title, category, tags, prep_minutes, cook_minutes, difficulty, featured_rank, featured_date",
    )
    .order("featured_rank", { ascending: true, nullsFirst: false })
    .order("featured_date", { ascending: false })
    .limit(limit);

  if (error || !data) return null;

  const rows = data as Array<
    Pick<
      FeaturedRecipeRow,
      "title" | "category" | "tags" | "prep_minutes" | "cook_minutes" | "difficulty"
    >
  >;

  return rows.map((r, i): BoardItem => {
    const tags =
      r.tags && r.tags.length ? r.tags : r.category ? [r.category] : [];
    return {
      title: r.title,
      role: r.category ?? "Featured",
      year: totalTime(r.prep_minutes, r.cook_minutes),
      tags: tags.slice(0, 3),
      accent: i % 2 === 0 ? "signal" : "pulse",
      status: r.difficulty ?? "featured",
    };
  });
}
