import { MonoLabel } from "@shift9/ui";
import { RevealGroup, RevealItem } from "./Reveal";
import { TESTIMONIALS } from "@/lib/site";

/* Named users, in their own words.

   Nothing here is written by us. TESTIMONIALS in lib/site.ts is empty until
   real quotes are collected from real users, and while it is empty this
   section does not render — an invented testimonial is worse than no
   testimonial. Add three to five entries there (outcome-specific: "I found
   that TikTok pasta recipe in 10 seconds", not "great app") and the wall
   appears with no other change. */

export function Testimonials() {
  if (TESTIMONIALS.length === 0) return null;

  return (
    <section
      id="people"
      className="scroll-mt-20 border-t border-line px-6 py-24 sm:px-10"
    >
      <div className="mx-auto max-w-[84rem]">
        <MonoLabel marker={false} decode className="mb-14">
          FROM PEOPLE COOKING WITH IT
        </MonoLabel>
        <RevealGroup className="grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <RevealItem key={t.name + t.quote} variant="scan" className="bg-void">
              <figure className="flex h-full flex-col justify-between gap-7 p-7 transition-premium hover:bg-well">
                <blockquote
                  className="font-display text-2xl leading-[1.25] text-ink"
                  style={{ fontVariationSettings: '"wght" 560' }}
                >
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="flex items-center gap-4">
                  {t.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.photo}
                      alt=""
                      width={44}
                      height={44}
                      loading="lazy"
                      decoding="async"
                      className="h-11 w-11 rounded-full border border-line object-cover"
                    />
                  ) : null}
                  <span className="flex flex-col">
                    <span className="text-body text-ink">{t.name}</span>
                    <MonoLabel marker={false}>{t.context}</MonoLabel>
                  </span>
                </figcaption>
              </figure>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
