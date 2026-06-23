import {
  DitherField,
  GridFrame,
  MagneticButton,
  MonoLabel,
  ProximityText,
  WorkWall,
} from "@shift9/ui";
import { Reveal } from "./_components/Reveal";
import { projects } from "@/lib/work-data";

const capabilities = [
  {
    id: "01",
    title: "Design",
    body: "Brand systems, identity, and interface design with a hard structural edge. Tokens first — vibes always.",
  },
  {
    id: "02",
    title: "Engineering",
    body: "Production apps and games — Next.js, Python, Supabase. Clean, optimized, and shipped to the store.",
  },
  {
    id: "03",
    title: "Systems",
    body: "The connective tissue: design tokens, content pipelines, and automation that keep every surface in sync.",
  },
];

export default function Home() {
  return (
    <main className="relative">
      <GridFrame coord="X:001 · Y:HOME" />

      {/* ─────────────────────────── HERO ─────────────────────────── */}
      <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-6 sm:px-10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <DitherField className="h-full w-full opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-b from-void/30 via-transparent to-void" />
        </div>

        <div className="mx-auto w-full max-w-[84rem]">
          <MonoLabel className="mb-8">SYS // ONLINE — SHIFT-9 STUDIO</MonoLabel>

          <ProximityText
            as="h1"
            className="text-display uppercase tracking-[-0.02em] text-ink"
          >
            We design
            <br />
            <span className="text-signal">&amp; ship.</span>
          </ProximityText>

          <p className="mt-8 max-w-xl text-body leading-relaxed text-muted">
            Shift-9 is a design <span className="text-ink">+</span> engineering
            studio. We build brands, products, and the systems that run them —
            clean, optimized, and impossible to ignore.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <MagneticButton href="#work">See the work</MagneticButton>
            <MagneticButton href="#contact" variant="ghost">
              Start a project
            </MagneticButton>
          </div>
        </div>

        <div className="absolute bottom-10 left-6 hidden sm:left-10 sm:block">
          <MonoLabel marker={false}>
            <span className="text-signal">↓</span>&nbsp;&nbsp;scroll //{" "}
            {projects.length} outputs indexed
          </MonoLabel>
        </div>
      </section>

      {/* ────────────────────────── MANIFESTO ─────────────────────── */}
      <section className="border-y border-line px-6 py-24 sm:px-10">
        <div className="mx-auto grid max-w-[84rem] gap-10 lg:grid-cols-[1fr_2fr]">
          <MonoLabel className="lg:pt-3">// manifesto — 001</MonoLabel>
          <Reveal>
            <p
              className="font-display text-h2 uppercase leading-[1.05] text-ink"
              style={{ fontVariationSettings: '"wght" 600, "wdth" 100' }}
            >
              Code execution in motion. We make software that looks engineered
              and feels effortless —{" "}
              <span className="text-pulse">no filler, no fluff,</span> just sharp
              work that ships.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ────────────────────────── WORK WALL ─────────────────────── */}
      <section id="work" className="scroll-mt-16 px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-[84rem]">
          <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
            <div>
              <MonoLabel className="mb-4">// selected output</MonoLabel>
              <ProximityText as="h2" className="text-h2 uppercase text-ink">
                The Work Wall
              </ProximityText>
            </div>
            <MonoLabel marker={false} className="text-signal">
              [ {projects.length} indexed ]
            </MonoLabel>
          </div>
          <WorkWall projects={projects} />
        </div>
      </section>

      {/* ───────────────────────── CAPABILITIES ───────────────────── */}
      <section
        id="capabilities"
        className="scroll-mt-16 border-t border-line px-6 py-24 sm:px-10"
      >
        <div className="mx-auto max-w-[84rem]">
          <MonoLabel className="mb-14">// capability index</MonoLabel>
          <div className="grid gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
            {capabilities.map((c, i) => (
              <Reveal key={c.id} delay={i * 0.08} className="bg-void">
                <article className="flex h-full flex-col gap-5 p-8 transition-premium hover:bg-well">
                  <span className="font-mono text-mono text-signal">{c.id}</span>
                  <h3
                    className="font-display text-3xl uppercase text-ink"
                    style={{ fontVariationSettings: '"wght" 740, "wdth" 116' }}
                  >
                    {c.title}
                  </h3>
                  <p className="text-body leading-relaxed text-muted">{c.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────── CONTACT ──────────────────────── */}
      <section id="contact" className="scroll-mt-16 px-6 py-28 sm:px-10">
        <div className="mx-auto max-w-[84rem]">
          <MonoLabel className="mb-8">// transmission open</MonoLabel>
          <ProximityText
            as="h2"
            className="text-display uppercase text-ink"
            minWeight={300}
            maxWeight={900}
          >
            Let&apos;s build
            <br />
            <span className="text-signal">something sharp.</span>
          </ProximityText>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <MagneticButton href="mailto:shift9.dev@gmail.com">
              shift9.dev@gmail.com
            </MagneticButton>
            <MagneticButton
              href="https://github.com/shift9-studio"
              variant="ghost"
            >
              GitHub ↗
            </MagneticButton>
          </div>
        </div>
      </section>

      {/* ─────────────────────────── FOOTER ───────────────────────── */}
      <footer className="border-t border-line px-6 py-10 sm:px-10">
        <div className="mx-auto flex max-w-[84rem] flex-wrap items-center justify-between gap-4">
          <MonoLabel marker={false}>© 2026 SHIFT-9 — built in motion</MonoLabel>
          <MonoLabel>build: stable</MonoLabel>
        </div>
      </footer>
    </main>
  );
}
