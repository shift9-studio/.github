import { Reveal } from "./Reveal";

/* Screens live under /screens, never /app: feelspoon.app/app and everything
   below it redirects to the web app (vercel.json), which would swallow them.
   `src` is a base name; each screen ships as a 420px and a 780px WebP.

   Real screens from the Just a Pinch app (captured from the app itself, not
   mockups), shown in a light phone frame. Pure layout + tokens — no motion to
   gate. Images are decorative-adjacent but meaningful, so each carries a
   descriptive alt. */

const SCREENS = [
  { src: "/screens/save", label: "Save from anywhere", alt: "Feelspoon app — Save from anywhere: a link, screenshot, or photo becomes a clean, cookable recipe." },
  { src: "/screens/cook", label: "Cook hands-free", alt: "Feelspoon app — Cook hands-free: step-by-step cooking mode with the screen awake and built-in timers." },
  { src: "/screens/plan", label: "Plan & shop smart", alt: "Feelspoon app — Plan and shop smart: build your week, then generate a shopping list from it." },
];

export function Phone({
  src,
  alt,
  label,
  eager = false,
}: {
  src: string;
  alt: string;
  label?: string;
  eager?: boolean;
}) {
  return (
    <figure className="flex flex-col items-center gap-5">
      <div className="relative w-[210px] max-w-full rounded-[2rem] border border-line bg-well p-2 shadow-2xl">
        {/* screen */}
        <div className="overflow-hidden rounded-[1.6rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {/* The frame is 210px wide on every breakpoint, so the browser is
              told that instead of being left to reserve a full-width slot. */}
          <img
            src={`${src}.webp`}
            srcSet={`${src}-420.webp 420w, ${src}.webp 780w`}
            alt={alt}
            width={390}
            height={844}
            sizes="210px"
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            className="block h-auto w-full"
          />
        </div>
        {/* speaker slit */}
        <div className="absolute left-1/2 top-[10px] h-1 w-16 -translate-x-1/2 rounded-full bg-line" aria-hidden />
      </div>
      {label ? (
        <figcaption className="font-display text-lg text-ink" style={{ fontVariationSettings: '"wght" 560' }}>
          {label}
        </figcaption>
      ) : null}
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
