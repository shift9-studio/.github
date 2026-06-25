import { GridFrame, MonoLabel, ProximityText } from "@shift9/ui";
import { Reveal } from "../_components/Reveal";

export const metadata = {
  title: "INSTRUMENT — Shift-9 Design System",
  description:
    "The shared colors, type, motion, and components that run through every Shift-9 surface.",
};

const tokens = [
  { name: "void",    hex: "#0a0e1a", label: "Background" },
  { name: "well",    hex: "#111827", label: "Surface" },
  { name: "surface", hex: "#1e2333", label: "Elevated" },
  { name: "line",    hex: "#1f2d3d", label: "Border" },
  { name: "muted",   hex: "#9aa7b8", label: "Secondary text" },
  { name: "ink",     hex: "#e6edf3", label: "Primary text" },
  { name: "signal",  hex: "#22d3ee", label: "Accent — signal" },
  { name: "pulse",   hex: "#f59e0b", label: "Accent — pulse" },
];

const type = [
  {
    label: "Display",
    sample: "Design in motion.",
    cls: "font-display text-5xl uppercase leading-none",
    meta: "Anybody · variable wght 100–900, wdth 75–125",
  },
  {
    label: "Heading 1",
    sample: "Ship with confidence.",
    cls: "font-display text-3xl uppercase leading-tight",
    meta: "Anybody · wght 700, wdth 112",
  },
  {
    label: "Body",
    sample: "One system. Every surface. No drift.",
    cls: "text-body leading-relaxed",
    meta: "System sans · 16px / 1.6",
  },
  {
    label: "Mono",
    sample: "SYS // ONLINE — BUILD: STABLE",
    cls: "font-mono text-mono uppercase tracking-[0.22em]",
    meta: "Martian Mono · 11px / tracking 0.22em",
  },
];

const motion = [
  {
    id: "01",
    name: "transition-premium",
    value: "all 260ms cubic-bezier(0.22, 1, 0.36, 1)",
    use: "Hover states, color transitions, opacity fades — the default touch for anything interactive.",
  },
  {
    id: "02",
    name: "Reveal",
    value: "opacity + translateY(22px) → 0 · 600ms ease-out",
    use: "Scroll-driven entry animation for sections and cards. Once-only, with a −80px margin.",
  },
  {
    id: "03",
    name: "Magnetic",
    value: "spring · stiffness 200 · damping 18",
    use: "Cursor-follow pull on buttons and work wall tiles. Strength 0.22, radius 170px.",
  },
  {
    id: "04",
    name: "Proximity",
    value: "fontVariationSettings wght interpolation · 240px radius",
    use: "Variable-font weight responds to cursor proximity — words thicken as the cursor approaches.",
  },
];

const components = [
  { name: "WorkWall",      desc: "Magnetic 3D tile grid — the primary project/recipe showcase." },
  { name: "DitherField",   desc: "WebGL dithered noise field — animated background for hero sections." },
  { name: "ProximityText", desc: "Variable-font weight driven by cursor distance." },
  { name: "MagneticButton",desc: "Spring-physics cursor-pull CTA button." },
  { name: "GridFrame",     desc: "Studio grid overlay with coordinate label — the 'system is live' affordance." },
  { name: "MonoLabel",     desc: "Mono uppercase section marker with optional rail marker." },
  { name: "CustomCursor",  desc: "Branded crosshair cursor that replaces the OS default." },
  { name: "Reveal",        desc: "Scroll-triggered fade + lift entry animation wrapper." },
];

export default function InstrumentPage() {
  return (
    <main className="relative">
      <GridFrame coord="X:005 · Y:INSTRUMENT" />

      {/* ─────────────────────────── HERO ─────────────────────────── */}
      <section className="border-b border-line px-6 py-28 sm:px-10">
        <div className="mx-auto max-w-[84rem]">
          <MonoLabel className="mb-8">// design system — instrument</MonoLabel>
          <ProximityText
            as="h1"
            className="text-display uppercase tracking-[-0.02em] text-ink"
          >
            One system.
            <br />
            <span className="text-signal">Every surface.</span>
          </ProximityText>
          <p className="mt-8 max-w-2xl text-body leading-relaxed text-muted">
            INSTRUMENT is the shared design foundation that runs through every
            Shift-9 surface — the studio site, Just a Pinch, and this page.
            Same colors, same type scale, same motion, same components. Nothing
            drifts.
          </p>
        </div>
      </section>

      {/* ──────────────────────── COLOR TOKENS ────────────────────── */}
      <section className="border-b border-line px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-[84rem]">
          <MonoLabel className="mb-14">// tokens — color</MonoLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {tokens.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.04}>
                <div className="flex flex-col gap-3">
                  <div
                    className="h-20 w-full border border-line"
                    style={{ background: t.hex }}
                  />
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink">
                      {t.name}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                      {t.hex}
                    </p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted opacity-70">
                      {t.label}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── TYPOGRAPHY ─────────────────────── */}
      <section className="border-b border-line px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-[84rem]">
          <MonoLabel className="mb-14">// tokens — type</MonoLabel>
          <div className="divide-y divide-line border border-line">
            {type.map((t, i) => (
              <Reveal key={t.label} delay={i * 0.06}>
                <div className="flex flex-col gap-4 p-8 lg:flex-row lg:items-center lg:gap-12">
                  <div className="w-28 shrink-0">
                    <p className="font-mono text-mono uppercase tracking-[0.18em] text-signal">
                      {t.label}
                    </p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-muted opacity-60">
                      {t.meta}
                    </p>
                  </div>
                  <p className={`text-ink ${t.cls}`}>{t.sample}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────── MOTION ────────────────────────── */}
      <section className="border-b border-line px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-[84rem]">
          <MonoLabel className="mb-14">// tokens — motion</MonoLabel>
          <div className="grid gap-px overflow-hidden border border-line bg-line md:grid-cols-2">
            {motion.map((m, i) => (
              <Reveal key={m.id} delay={i * 0.06} className="bg-void">
                <article className="flex h-full flex-col gap-4 p-8 transition-premium hover:bg-well">
                  <span className="font-mono text-mono text-signal">{m.id}</span>
                  <h3 className="font-mono text-sm uppercase tracking-[0.16em] text-ink">
                    {m.name}
                  </h3>
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-pulse">
                    {m.value}
                  </p>
                  <p className="text-body leading-relaxed text-muted">{m.use}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────── COMPONENTS ────────────────────── */}
      <section className="border-b border-line px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-[84rem]">
          <MonoLabel className="mb-14">// component index</MonoLabel>
          <div className="divide-y divide-line border border-line">
            {components.map((c, i) => (
              <Reveal key={c.name} delay={i * 0.04}>
                <div className="flex flex-col gap-2 p-6 transition-premium hover:bg-well sm:flex-row sm:items-center sm:gap-10">
                  <p className="w-48 shrink-0 font-mono text-sm uppercase tracking-[0.16em] text-signal">
                    {c.name}
                  </p>
                  <p className="text-body leading-relaxed text-muted">{c.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────── FOOTER ───────────────────────── */}
      <footer className="border-t border-line px-6 py-10 sm:px-10">
        <div className="mx-auto flex max-w-[84rem] flex-wrap items-center justify-between gap-4">
          <MonoLabel marker={false}>INSTRUMENT — Shift-9 Design System</MonoLabel>
          <a
            href="/"
            className="font-mono text-mono uppercase tracking-[0.18em] text-signal opacity-60 transition-premium hover:opacity-100 hover:[filter:drop-shadow(0_0_6px_#22d3ee)]"
          >
            ← back to studio
          </a>
        </div>
      </footer>
    </main>
  );
}
