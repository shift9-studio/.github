import {
  DitherField,
  GridFrame,
  MagneticButton,
  MonoLabel,
  ProximityText,
  WorkWall,
  type DitherPalette,
} from "@shift9/ui";
import { Reveal } from "./_components/Reveal";
import { board } from "@/lib/menu-data";

/* Warm re-skin of the shared dither hero — saffron resolving to paprika.
   Same shader, different surface. */
const warm: DitherPalette = {
  base: "#1b1410",
  signal: "#f5a524",
  pulse: "#e8633a",
};

const steps = [
  {
    id: "01",
    title: "Stock",
    body: "Tell us what's in the pantry — or just snap a photo. Just a Pinch remembers, so you never buy the cumin you already own again.",
  },
  {
    id: "02",
    title: "Suggest",
    body: "The engine matches real recipes to your ingredients, your time, and tonight's craving — then swaps anything you're missing.",
  },
  {
    id: "03",
    title: "Cook",
    body: "Step-by-step, scaled to your servings, timed to your night. No ten-paragraph life story. Just dinner, handled.",
  },
];

const features = [
  {
    k: "pantry-aware",
    t: "Pantry-aware",
    b: "Recipes built from what you already have. Less waste, fewer midnight grocery runs.",
  },
  {
    k: "smart-swaps",
    t: "Smart swaps",
    b: "Out of buttermilk? We hand you the fix before you panic-Google it mid-recipe.",
  },
  {
    k: "scaled",
    t: "Scaled to taste",
    b: "One quiet dinner or a full table — quantities and timings recalculate themselves.",
  },
  {
    k: "fresh-daily",
    t: "Fresh daily",
    b: "A new board every morning, seeded from Supabase. There's always something to cook.",
  },
];

export default function Home() {
  return (
    <main className="relative">
      <GridFrame label="JUST A PINCH // INSTRUMENT" coord="X:001 · Y:KITCHEN" />

      {/* ─────────────────────────── HERO ─────────────────────────── */}
      <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-6 sm:px-10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <DitherField palette={warm} className="h-full w-full opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-b from-void/30 via-transparent to-void" />
        </div>

        <div className="mx-auto w-full max-w-[84rem]">
          <MonoLabel className="mb-8">JUST A PINCH // SMART RECIPES</MonoLabel>

          <ProximityText
            as="h1"
            className="text-display uppercase tracking-[-0.02em] text-ink"
          >
            Cook anything.
            <br />
            <span className="text-signal">Waste nothing.</span>
          </ProximityText>

          <p className="mt-8 max-w-xl text-body leading-relaxed text-muted">
            Just a Pinch reads your pantry, your taste, and your clock — then
            hands you the recipe you&apos;ll{" "}
            <span className="text-ink">actually</span> make tonight. Smart
            substitutions, scaled to taste, zero guesswork.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <MagneticButton href="#get">Get the app</MagneticButton>
            <MagneticButton href="#how" variant="ghost">
              See how it works
            </MagneticButton>
          </div>
        </div>

        <div className="absolute bottom-10 left-6 hidden sm:left-10 sm:block">
          <MonoLabel marker={false}>
            <span className="text-signal">↓</span>&nbsp;&nbsp;scroll //{" "}
            {board.length} dishes on today&apos;s board
          </MonoLabel>
        </div>
      </section>

      {/* ────────────────────────── MANIFESTO ─────────────────────── */}
      <section className="border-y border-line px-6 py-24 sm:px-10">
        <div className="mx-auto grid max-w-[84rem] gap-10 lg:grid-cols-[1fr_2fr]">
          <MonoLabel className="lg:pt-3">// the idea — 001</MonoLabel>
          <Reveal>
            <p
              className="font-display text-h2 leading-[1.05] text-ink"
              style={{ fontVariationSettings: '"wght" 580' }}
            >
              Most recipe apps bury you in ingredients you don&apos;t have. We
              start with what&apos;s already in your kitchen —{" "}
              <span className="text-pulse">and a pinch of taste.</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ───────────────────────── HOW IT WORKS ───────────────────── */}
      <section id="how" className="scroll-mt-16 px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-[84rem]">
          <MonoLabel className="mb-14">// three steps to dinner</MonoLabel>
          <div className="grid gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.id} delay={i * 0.08} className="bg-void">
                <article className="flex h-full flex-col gap-5 p-8 transition-premium hover:bg-well">
                  <span className="font-mono text-mono text-signal">
                    {s.id}
                  </span>
                  <h3
                    className="font-display text-3xl text-ink"
                    style={{ fontVariationSettings: '"wght" 620' }}
                  >
                    {s.title}
                  </h3>
                  <p className="text-body leading-relaxed text-muted">
                    {s.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── DAILY BOARD ────────────────────── */}
      <section id="board" className="scroll-mt-16 px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-[84rem]">
          <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
            <div>
              <MonoLabel className="mb-4">// today&apos;s board</MonoLabel>
              <ProximityText as="h2" className="text-h2 text-ink">
                Seeded fresh this morning
              </ProximityText>
            </div>
            <MonoLabel marker={false} className="text-signal">
              [ {board.length} dishes ]
            </MonoLabel>
          </div>
          <WorkWall projects={board} />
        </div>
      </section>

      {/* ────────────────────────── FEATURES ──────────────────────── */}
      <section
        id="features"
        className="scroll-mt-16 border-t border-line px-6 py-24 sm:px-10"
      >
        <div className="mx-auto max-w-[84rem]">
          <MonoLabel className="mb-14">// why it works</MonoLabel>
          <div className="grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <Reveal key={f.k} delay={i * 0.06} className="bg-void">
                <article className="flex h-full flex-col gap-4 p-7 transition-premium hover:bg-well">
                  <MonoLabel marker={false} className="text-signal">
                    {f.k}
                  </MonoLabel>
                  <h3
                    className="font-display text-2xl text-ink"
                    style={{ fontVariationSettings: '"wght" 600' }}
                  >
                    {f.t}
                  </h3>
                  <p className="text-body leading-relaxed text-muted">{f.b}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────── CTA ──────────────────────────── */}
      <section id="get" className="scroll-mt-16 px-6 py-28 sm:px-10">
        <div className="mx-auto max-w-[84rem]">
          <MonoLabel className="mb-8">// pull up a chair</MonoLabel>
          <ProximityText
            as="h2"
            className="text-display uppercase text-ink"
            minWeight={300}
            maxWeight={900}
          >
            Dinner&apos;s
            <br />
            <span className="text-signal">figured out.</span>
          </ProximityText>
          <p className="mt-8 max-w-xl text-body leading-relaxed text-muted">
            Join the first batch of cooks. We&apos;ll ping you the moment Just a
            Pinch lands — no spam, just a heads-up worth opening.
          </p>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <MagneticButton href="mailto:hello@shift9.dev?subject=Just%20a%20Pinch%20waitlist">
              Join the waitlist
            </MagneticButton>
            <MagneticButton href="https://shift9.dev" variant="ghost">
              By Shift-9 ↗
            </MagneticButton>
          </div>
        </div>
      </section>

      {/* ─────────────────────────── FOOTER ───────────────────────── */}
      <footer className="border-t border-line px-6 py-10 sm:px-10">
        <div className="mx-auto flex max-w-[84rem] flex-wrap items-center justify-between gap-4">
          <MonoLabel marker={false}>
            © 2026 JUST A PINCH — a Shift-9 product
          </MonoLabel>
          <MonoLabel>build: simmering</MonoLabel>
        </div>
      </footer>
    </main>
  );
}
