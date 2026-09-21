import { MonoLabel } from "@shift9/ui";
import { Reveal } from "./Reveal";
import { FOUNDER, PLAY_URL, STUDIO_URL } from "@/lib/site";

/* Who built this, and the answer to the objection the audit found underneath
   every other one: that recipe apps are built by people who thought cooking
   was a content problem. Twenty years running restaurants answers it in one
   line, and it is his line, not ours.

   Photo, name, role, quote and link all come from his public LinkedIn
   profile. Nothing here is written for him. */

export function FounderNote() {
  return (
    <section
      id="who"
      className="scroll-mt-20 border-t border-line px-6 py-24 sm:px-10"
    >
      <div className="mx-auto max-w-[84rem]">
        <MonoLabel decode className="mb-10">
          WHO MADE IT
        </MonoLabel>

        <Reveal>
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:gap-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={FOUNDER.photo}
              srcSet={`${FOUNDER.photo} 1x, ${FOUNDER.photo2x} 2x`}
              alt={`${FOUNDER.name}, who built Feelspoon`}
              width={224}
              height={224}
              sizes="224px"
              loading="lazy"
              decoding="async"
              className="h-40 w-40 shrink-0 rounded-full border border-line object-cover sm:h-56 sm:w-56"
            />

            <div className="max-w-2xl">
              <blockquote
                className="font-display text-h2 leading-[1.08] text-ink"
                style={{ fontVariationSettings: '"wght" 560' }}
              >
                &ldquo;{FOUNDER.why}&rdquo;
              </blockquote>

              {/* One voice the whole way down. It reads as his, because it is
                  his: both sentences are lifted from his own posts. */}
              <p className="mt-6 text-body leading-relaxed text-muted">
                <span className="text-ink">{FOUNDER.name}</span> &middot;{" "}
                {FOUNDER.role}
              </p>

              <p className="mt-5 text-body leading-relaxed text-muted">
                {FOUNDER.background}{" "}
                My name is the one on the Google Play
                listing, so the person shipping the updates is the person
                you&apos;re writing to.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
                <a
                  href={FOUNDER.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-mono uppercase tracking-[0.18em] text-signal transition-premium hover:text-ink"
                >
                  LinkedIn ↗
                </a>
                <a
                  href={STUDIO_URL}
                  className="font-mono text-mono uppercase tracking-[0.18em] text-muted transition-premium hover:text-ink"
                >
                  Shift-9 ↗
                </a>
                <a
                  href={PLAY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-mono uppercase tracking-[0.18em] text-muted transition-premium hover:text-ink"
                >
                  Developer on Google Play ↗
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
