import { MonoLabel } from "@shift9/ui";
import { PLAY_URL, PROOF_MIN_DOWNLOADS } from "@/lib/site";
import { getPlayProof } from "@/lib/play-proof";

/* Third-party proof, read from the live Google Play listing at build time and
   refreshed daily. Nothing is typed in by hand, so the star rating appears on
   the site the day Play publishes one.

   What it will and will not show:
   - a star rating and its review count, as soon as Play has them
   - a download figure only once it passes PROOF_MIN_DOWNLOADS; "10+" as a
     trust signal reads worse than silence, and today Play says 10+
   - nothing at all when there is nothing true to say */

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span aria-hidden className="tracking-[0.2em] text-signal">
      {"★".repeat(full)}
      {"☆".repeat(Math.max(0, 5 - full))}
    </span>
  );
}

export async function PlayProof() {
  const { rating, reviews, downloads } = await getPlayProof();

  const downloadsNum = downloads
    ? Number(downloads.replace(/[+,]/g, "").replace(/K$/i, "000").replace(/M$/i, "000000"))
    : 0;
  const showDownloads = downloads != null && downloadsNum >= PROOF_MIN_DOWNLOADS;

  if (rating == null && !showDownloads) return null;

  return (
    <section className="border-y border-line px-6 py-6 sm:px-10">
      <a
        href={PLAY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mx-auto flex max-w-[84rem] flex-wrap items-center gap-x-6 gap-y-3 transition-premium hover:opacity-80"
      >
        {rating != null ? (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Stars rating={rating} />
            <span className="font-display text-xl text-ink">
              {rating.toFixed(1)} on Google Play
            </span>
            {reviews != null ? (
              <MonoLabel marker={false}>
                {reviews.toLocaleString()} rating{reviews === 1 ? "" : "s"}
              </MonoLabel>
            ) : null}
          </span>
        ) : null}
        {showDownloads ? (
          <MonoLabel marker={false}>{downloads} downloads</MonoLabel>
        ) : null}
        <MonoLabel marker={false} className="text-signal">
          See the listing ↗
        </MonoLabel>
      </a>
    </section>
  );
}
