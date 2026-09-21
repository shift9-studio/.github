import { MonoLabel } from "@shift9/ui";
import { RevealGroup, RevealItem } from "./Reveal";
import { FAQ } from "@/lib/faq";

/* The four things people actually hesitate over: the platform, the free
   alternatives, the price, and whether the import really strips the blog.
   Answered here in plain words, and fed verbatim into the FAQPage JSON-LD in
   layout.tsx so an assistant answers the same way.

   Native <details> rather than a JS accordion: it opens without hydration,
   it is keyboard-operable for free, and the text is in the page for a crawler
   whether it is open or not. */

export function Faq() {
  return (
    <section
      id="faq"
      className="scroll-mt-20 border-t border-line px-6 py-24 sm:px-10"
    >
      <div className="mx-auto grid max-w-[84rem] gap-10 lg:grid-cols-[1fr_2fr]">
        <div>
          <MonoLabel decode className="mb-4">
            BEFORE YOU DOWNLOAD
          </MonoLabel>
          <h2
            className="font-display text-h2 leading-[1.05] text-ink"
            style={{ fontVariationSettings: '"wght" 580' }}
          >
            Fair questions.
          </h2>
        </div>

        <RevealGroup className="grid gap-px overflow-hidden border border-line bg-line">
          {FAQ.map((f) => (
            <RevealItem key={f.q} variant="scan" className="bg-void">
              <details className="group p-7 transition-premium open:bg-well hover:bg-well">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-ink [&::-webkit-details-marker]:hidden">
                  <h3
                    className="font-display text-2xl"
                    style={{ fontVariationSettings: '"wght" 600' }}
                  >
                    {f.q}
                  </h3>
                  <span
                    aria-hidden
                    className="font-mono text-mono text-signal transition-premium group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-5 max-w-2xl text-body leading-relaxed text-muted">
                  {f.a}
                </p>
              </details>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
