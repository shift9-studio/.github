import { MonoLabel } from "@shift9/ui";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";

/* The one thing the competition does not do, given its own width.

   This section used to be about "smart swaps". That feature does not exist:
   19 Sep 2026, nothing in the app, the edge functions or the Play listing
   offers an ingredient substitution, so the claim came down rather than get a
   picture drawn for it. What went in instead is the thing the product really
   is best at and Paprika's page does not document at all — getting the recipe
   IN, from whatever form it arrived in. Kariim's own words for it: "a recipe
   app that solves the annoying part: getting the recipe in".

   The picture is a real screen shipped in the app. */

const WAYS = [
  {
    from: "A link",
    got: "Title, ingredients, steps, times and the photo. The ten-paragraph life story stays behind.",
  },
  {
    from: "A photo",
    got: "A recipe card, a cookbook page, or Grandma's handwriting, read and turned into steps you can cook from.",
  },
  {
    from: "Pasted text",
    got: "The block someone sent you in a message, straightened out into a real recipe.",
  },
  {
    from: "A description",
    got: "Say what you're craving and it writes the recipe. Up to 40 a day on Premium.",
  },
];

export function Differentiator() {
  return (
    <section
      id="capture"
      className="scroll-mt-20 border-t border-line px-6 py-24 sm:px-10"
    >
      <div className="mx-auto grid max-w-[84rem] items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <MonoLabel marker={false} decode className="mb-6">
            THE ANNOYING PART, SOLVED
          </MonoLabel>

          <h2
            className="font-display text-h2 leading-[1.04] text-ink"
            style={{ fontVariationSettings: '"wght" 600' }}
          >
            Every other recipe app can save a link.{" "}
            <span className="text-pulse">
              Yours arrive as screenshots, cards and texts from your mum.
            </span>
          </h2>

          <p className="mt-7 max-w-xl text-body leading-relaxed text-muted">
            Feelspoon takes all four, and what lands is the same either way: a
            clean recipe with the quantities, the steps and the times, ready to
            cook and saved on your phone.
          </p>

          <RevealGroup className="mt-10 grid gap-px overflow-hidden border border-line bg-line">
            {WAYS.map((w) => (
              <RevealItem key={w.from} variant="scan" className="bg-void">
                <article className="flex flex-col gap-2 p-6 transition-premium hover:bg-well sm:flex-row sm:items-baseline sm:gap-8">
                  <h3
                    className="font-display text-xl text-ink sm:w-44 sm:shrink-0"
                    style={{ fontVariationSettings: '"wght" 600' }}
                  >
                    {w.from}
                  </h3>
                  <p className="text-body leading-relaxed text-muted">{w.got}</p>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        <Reveal>
          <figure className="relative mx-auto w-[240px] max-w-full rounded-[2rem] border border-line bg-well p-2 shadow-2xl">
            <div className="overflow-hidden rounded-[1.6rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/screens/save.webp"
                srcSet="/screens/save-420.webp 420w, /screens/save.webp 780w"
                alt="Feelspoon app — Save from anywhere: a link, screenshot, or photo becomes a clean, cookable recipe."
                width={390}
                height={844}
                sizes="(min-width: 1024px) 240px, 60vw"
                loading="lazy"
                decoding="async"
                className="block h-auto w-full"
              />
            </div>
            <div
              className="absolute left-1/2 top-[10px] h-1 w-16 -translate-x-1/2 rounded-full bg-line"
              aria-hidden
            />
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
