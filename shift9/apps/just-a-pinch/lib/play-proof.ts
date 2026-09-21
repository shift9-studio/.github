import { PLAY_URL } from "./site";

/* The Google Play listing, read at build time, so the star rating and the
   review count appear on the site the day Play starts publishing them and
   nobody has to remember to come back and type them in.

   Rules this follows, because a trust signal that is wrong is worse than none:
   - anything it is not sure about comes back null, and the strip renders nothing
   - it never throws; a failed or slow fetch is just "no proof today"
   - the page revalidates daily, so the numbers cannot go stale for long

   As of 19 Sep 2026 Play publishes "10+" downloads and no star rating yet
   (too few ratings), so the strip stays hidden on its own. */

export type PlayProofData = {
  rating: number | null;
  reviews: number | null;
  downloads: string | null;
};

const EMPTY: PlayProofData = { rating: null, reviews: null, downloads: null };

/** "1.2M" / "20.6K" / "1,234" -> a number. Null if it is not one of those. */
function toCount(raw: string): number | null {
  const m = raw.trim().replace(/,/g, "").match(/^(\d+(?:\.\d+)?)([KMB])?$/i);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  const mult = { k: 1e3, m: 1e6, b: 1e9 }[(m[2] ?? "").toLowerCase()] ?? 1;
  return Math.round(n * mult);
}

export async function getPlayProof(): Promise<PlayProofData> {
  let html: string;
  try {
    const res = await fetch(PLAY_URL, {
      headers: {
        // Play serves the lightweight listing to a plain desktop agent.
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
        "accept-language": "en-US,en;q=0.9",
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return EMPTY;
    html = await res.text();
  } catch {
    return EMPTY;
  }

  // Play writes these as aria-labels and adjacent captions. Each pattern is
  // matched on its own; one missing piece never blanks the others.
  // Only the app's OWN header stat row counts. Searching the whole page finds
  // the "similar apps" carousel and would print a COMPETITOR's stars as ours:
  // a plain "Rated x stars" search on this listing returns 4.0, which belongs
  // to another app. So the page is cut at the carousel first, then each figure
  // is read out of its own stat cell, which Play renders as
  //   <div class="ClM7O">VALUE</div><div class="g1rdde">CAPTION</div>
  const cut = html.search(/Similar apps|You might also like/i);
  const head = cut > 0 ? html.slice(0, cut) : html;

  const cells = [
    ...head.matchAll(/<div class="ClM7O">(.*?)<\/div><div class="g1rdde">(.*?)<\/div>/g),
  ].map((m) => ({
    value: (m[1] ?? "").replace(/<[^>]*>/g, "").trim(),
    caption: (m[2] ?? "").replace(/<[^>]*>/g, "").trim(),
  }));

  const starCell = cells.find((c) => /^[\d.,]+[KMB]?\s*reviews?$/i.test(c.caption));
  const rating = starCell ? Number(starCell.value) : null;
  const reviews = starCell
    ? toCount(starCell.caption.replace(/\s*reviews?$/i, ""))
    : null;

  const downloadsRaw =
    cells.find((c) => /^downloads$/i.test(c.caption))?.value ?? null;

  return {
    rating: rating != null && rating >= 1 && rating <= 5 ? rating : null,
    reviews: reviews != null && reviews > 0 ? reviews : null,
    downloads: downloadsRaw ?? null,
  };
}
