import { Reveal } from "./Reveal";

/* Real screens from the Just a Pinch app (captured from the app itself, not
   mockups), shown in a light phone frame. Pure layout + tokens — no motion to
   gate. Images are decorative-adjacent but meaningful, so each carries a
   descriptive alt. */

const SCREENS = [
  { src: "/app/save.png", label: "Save from anywhere", alt: "Feelspoon app — Save from anywhere: a link, screenshot, or photo becomes a clean, cookable recipe." },
  { src: "/app/cook.png", label: "Cook hands-free", alt: "Feelspoon app — Cook hands-free: step-by-step cooking mode with the screen awake and built-in timers." },
  { src: "/app/plan.png", label: "Plan & shop smart", alt: "Feelspoon app — Plan and shop smart: build your week, then generate a shopping list from it." },
];

function Phone({ src, alt, label }: { src: string; alt: string; label: string }) {
  return (
    <figure className="flex flex-col items-center gap-5">
      <div className="relative w-[210px] max-w-full rounded-[2rem] border border-line bg-well p-2 shadow-2xl">
        {/* screen */}
        <div className="overflow-hidden rounded-[1.6rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} width={390} height={844} className="block h-auto w-full" />
        </div>
        {/* speaker slit */}
        <div className="absolute left-1/2 top-[10px] h-1 w-16 -translate-x-1/2 rounded-full bg-line" aria-hidden />
      </div>
      <figcaption className="font-display text-lg text-ink" style={{ fontVariationSettings: '"wght" 560' }}>
        {label}
      </figcaption>
    </figure>
  );
}

export function PhoneShowcase() {
  return (
    <section id="app" className="scroll-mt-16 border-t border-line px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-[84rem]">
        <div className="mb-14">
          <p className="mb-4 font-mono text-mono uppercase tracking-widest text-signal">
            straight from the app
          </p>
          <h2 className="font-display text-h2 text-ink" style={{ fontVariationSettings: '"wght" 600' }}>
            The real thing, in your hand
          </h2>
        </div>
        <Reveal>
          <div className="grid justify-items-center gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {SCREENS.map((s) => (
              <Phone key={s.src} {...s} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
