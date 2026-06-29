import {
  CustomCursor,
  EdgeReticle,
  GridFrame,
  MagneticButton,
  MonoLabel,
  ProximityText,
} from "@shift9/ui";
import { Reveal } from "../_components/Reveal";

export const metadata = {
  title: "INSTRUMENT — Shift-9 Design System",
  description:
    "The shared colors, type, motion, components, and live instrumentation that run through every Shift-9 surface.",
};

/* Swatches render from the live CSS variables, so this page can never drift
   from the real tokens — the value strings mirror @shift9/theme/tokens.css. */
const tokens = [
  { name: "void", css: "var(--s9-void)", value: "#0f172a", label: "Background — the void" },
  { name: "well", css: "var(--s9-void-2)", value: "#0b1120", label: "Deeper well" },
  { name: "surface", css: "var(--s9-surface)", value: "#131c31", label: "Raised panel" },
  { name: "ink", css: "var(--s9-ink)", value: "#e2e8f0", label: "Primary text" },
  { name: "muted", css: "var(--s9-ink-dim)", value: "#64748b", label: "Mono / secondary" },
  { name: "signal", css: "var(--s9-signal)", value: "#22d3ee", label: "Accent — signal" },
  { name: "pulse", css: "var(--s9-pulse)", value: "#8b5cf6", label: "Accent — pulse" },
  { name: "line", css: "var(--s9-line)", value: "signal · 16%", label: "Hairline border" },
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
    meta: "Martian Mono · fluid 1rem → 1.13rem",
  },
  {
    label: "Mono",
    sample: "SYS // ONLINE — BUILD: STABLE",
    cls: "font-mono text-mono uppercase tracking-[0.22em]",
    meta: "Martian Mono · 0.82rem / tracking 0.22em",
  },
];

const motion = [
  {
    id: "01",
    name: "transition-premium",
    value: "all 300ms cubic-bezier(0.22, 1, 0.36, 1)",
    use: "Hover states, color transitions, opacity fades — the default touch for anything interactive.",
  },
  {
    id: "02",
    name: "Reveal",
    value: "opacity + translateY(22px) → 0 · 600ms house ease",
    use: "Scroll-driven entry animation for sections and cards. Once-only, with a −80px margin.",
  },
  {
    id: "03",
    name: "Magnetic",
    value: "spring · stiffness 260 · damping 18",
    use: "Cursor-follow pull on buttons and work-wall tiles. Tiles: strength 0.22, radius 170px.",
  },
  {
    id: "04",
    name: "Proximity",
    value: "fontVariationSettings wght/wdth · 320px radius",
    use: "Variable-font weight responds to cursor proximity — words thicken as the cursor approaches.",
  },
];

/* The live instrumentation layer — the "INSTRUMENT // LIVE" suite. */
const live = [
  {
    id: "01",
    name: "GridFrame · LIVE",
    value: "telemetry HUD · 1 shared rAF / pointer / IO",
    use: "The frame's labels become real: live cursor grid-coords, scroll depth, active section, viewport, a smoothed FPS gauge, a 1 Hz SYNC blink, and an edge scroll-trace. Writes straight to the DOM — zero React re-renders.",
  },
  {
    id: "02",
    name: "Phosphor Sweep",
    value: "WebGL render-to-texture feedback · ~3px ring",
    use: "A decaying CRT beam orbits the frame's inner hairline like an oscilloscope refreshing its bezel — true GPU feedback, hard-masked to the gutter so it never touches content.",
  },
  {
    id: "03",
    name: "POWER-ON",
    value: "one-time boot · ~0.9s · pure CSS",
    use: "On load the instrument powers on: corner ticks strike in sequence, the frame settles, the rail spins up — content fully interactive underneath the whole time.",
  },
  {
    id: "04",
    name: "EdgeReticle",
    value: "spring viewfinder · augments :focus-visible",
    use: "Camera-style corner brackets lock onto the focused (or hovered) control and fly between targets. Adds to the focus ring — never replaces it.",
  },
  {
    id: "05",
    name: "CursorLumen",
    value: "screen-blended bloom · three-body lag",
    use: "A soft volumetric light trails the cursor a beat behind the ring — depth without 3D. Screen blend lifts luminance only, so it can't hurt text contrast.",
  },
  {
    id: "06",
    name: "SpiceMote · GrainField",
    value: "Just a Pinch · warm signatures",
    use: "The product surface gets its own voice — a 'pinch of spice' cursor sprinkle and an editorial cookbook grain — instead of the studio's console chrome. Same engine, different flavor.",
  },
];

/* The Just a Pinch surface — the same INSTRUMENT engine, re-skinned warm.
   Swatches use literal hex (this page renders in the cool studio theme), so
   the warm palette shows true even here. Mirrors apps/just-a-pinch globals. */
const pinchPalette = [
  { name: "espresso", value: "#1b1410", label: "Warm base" },
  { name: "well", value: "#130d0a", label: "Deeper well" },
  { name: "surface", value: "#241a13", label: "Raised panel" },
  { name: "cream", value: "#f6ead8", label: "Primary text" },
  { name: "taupe", value: "#a99780", label: "Mono / secondary" },
  { name: "saffron", value: "#f5a524", label: "Accent — signal" },
  { name: "paprika", value: "#e8633a", label: "Accent — pulse" },
];

const pinchTech = [
  {
    id: "01",
    name: "Fraunces display",
    value: "variable antiqua · opsz / wght / SOFT / WONK",
    use: "Swaps the studio's Anybody for a warm, high-contrast serif with a little 'wonk' — same kinetic-variable DNA, a softer, appetite-first voice.",
  },
  {
    id: "02",
    name: "SeasonHeadline",
    value: "per-word rise + de-blur · staggered",
    use: "Headlines 'season in' word by word on a warm curve, then gain weight with scroll velocity once settled — the product's own type signature.",
  },
  {
    id: "03",
    name: "SpiceMote",
    value: "Canvas2D · additive blend · gravity",
    use: "A pinch-of-spice cursor: saffron, paprika, and cream motes spray from the pointer and settle under gravity, glowing where they overlap. Keeps the native OS cursor.",
  },
  {
    id: "04",
    name: "GrainField",
    value: "SVG fractal noise · soft-light",
    use: "An editorial cookbook-paper grain over the warm surface — printed-recipe tactility that reads as expensive without announcing itself.",
  },
  {
    id: "05",
    name: "Hero parallax",
    value: "scroll-linked ken burns",
    use: "The food photo drifts and scales behind the warm Dither for depth, overscanned so the motion never exposes an edge.",
  },
  {
    id: "06",
    name: "Warm Dither re-skin",
    value: "same shader · saffron → paprika palette",
    use: "The exact INSTRUMENT dither hero, recolored by passing a warm palette as uniforms. One engine, a different flavor — the unification proof in a single component.",
  },
];

const components = [
  { name: "WorkWall", desc: "Magnetic 3D tile grid — the primary project/recipe showcase." },
  { name: "DitherField", desc: "WebGL dithered noise field — palette-driven animated hero background." },
  { name: "ProximityText", desc: "Variable-font weight/width driven by cursor distance." },
  { name: "MagneticButton", desc: "Spring-physics cursor-pull CTA button." },
  { name: "GridFrame", desc: "Coordinate scaffold + corner ticks. `live` wakes its telemetry; `boot` plays the power-on." },
  { name: "TelemetryRail", desc: "The live readout that turns GridFrame into a working instrument — coords, scroll, section, FPS, SYNC." },
  { name: "GridSweep", desc: "WebGL feedback shader — the phosphor beam tracing the frame's hairline." },
  { name: "EdgeReticle", desc: "Spring-loaded viewfinder brackets that lock onto the focused or hovered control." },
  { name: "CustomCursor", desc: "Console cursor — fast dot, trailing ring, and a volumetric light bloom; replaces the OS default." },
  { name: "SpiceMote", desc: "Just a Pinch's warm cursor — a sprinkle of saffron/paprika motes that settle under gravity." },
  { name: "GrainField", desc: "Editorial film-grain texture for the warm product surface." },
  { name: "MonoLabel", desc: "Mono uppercase section marker with optional rail marker." },
  { name: "Reveal", desc: "Scroll-triggered fade + lift entry animation wrapper." },
  { name: "useInstrumentTelemetry", desc: "The shared hook behind LIVE — one rAF, one pointer listener, one IntersectionObserver." },
];

export default function InstrumentPage() {
  return (
    <>
      <CustomCursor />
      <EdgeReticle />
      <main className="relative">
        <GridFrame coord="X:005 · Y:INSTRUMENT" live boot />

        {/* ─────────────────────────── HERO ─────────────────────────── */}
        <section
          data-tele-section="INSTRUMENT"
          className="border-b border-line px-6 py-28 sm:px-10"
        >
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
              Same colors, same type scale, same motion, same components, plus a
              live instrumentation layer that makes the chrome read the machine.
              Nothing drifts.
            </p>
          </div>
        </section>

        {/* ──────────────────────── COLOR TOKENS ────────────────────── */}
        <section
          data-tele-section="COLOR"
          className="border-b border-line px-6 py-24 sm:px-10"
        >
          <div className="mx-auto max-w-[84rem]">
            <MonoLabel className="mb-14">// tokens — color</MonoLabel>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {tokens.map((t, i) => (
                <Reveal key={t.name} delay={i * 0.04}>
                  <div className="flex flex-col gap-3">
                    <div
                      className="h-20 w-full border border-line"
                      style={{ background: t.css }}
                    />
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink">
                        {t.name}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                        {t.value}
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
        <section
          data-tele-section="TYPE"
          className="border-b border-line px-6 py-24 sm:px-10"
        >
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
        <section
          data-tele-section="MOTION"
          className="border-b border-line px-6 py-24 sm:px-10"
        >
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

        {/* ───────────────────── JUST A PINCH SURFACE ───────────────── */}
        <section
          data-tele-section="SURFACE"
          className="border-b border-line px-6 py-24 sm:px-10"
        >
          <div className="mx-auto max-w-[84rem]">
            <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
              <div>
                <MonoLabel className="mb-4">// surface — just a pinch</MonoLabel>
                <ProximityText as="h2" className="text-h2 uppercase text-ink">
                  One engine, a warmer flavor
                </ProximityText>
              </div>
              <MonoLabel marker={false} className="text-signal">
                [ same system · re-skinned ]
              </MonoLabel>
            </div>

            <p className="mb-12 max-w-2xl text-body leading-relaxed text-muted">
              Just a Pinch runs on this exact INSTRUMENT system, then re-skins it
              for food. The console cool of shift9.dev gives way to a warm,
              appetite-first surface — a different palette, a serif display, and a
              set of tactile signatures, all driven by the same engine.
            </p>

            {/* warm palette */}
            <div className="mb-14 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {pinchPalette.map((t, i) => (
                <Reveal key={t.name} delay={i * 0.04}>
                  <div className="flex flex-col gap-3">
                    <div
                      className="h-20 w-full border border-line"
                      style={{ background: t.value }}
                    />
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink">
                        {t.name}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                        {t.value}
                      </p>
                      <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted opacity-70">
                        {t.label}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* warm techniques */}
            <div className="grid gap-px overflow-hidden border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
              {pinchTech.map((m, i) => (
                <Reveal key={m.id} delay={i * 0.05} className="bg-void">
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

            <div className="mt-12">
              <MagneticButton href="https://pinch.shift9.dev">
                See Just a Pinch live ↗
              </MagneticButton>
            </div>
          </div>
        </section>

        {/* ───────────────────── LIVE INSTRUMENTATION ───────────────── */}
        <section
          data-tele-section="LIVE"
          className="border-b border-line px-6 py-24 sm:px-10"
        >
          <div className="mx-auto max-w-[84rem]">
            <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
              <div>
                <MonoLabel className="mb-4">// instrument — live</MonoLabel>
                <ProximityText as="h2" className="text-h2 uppercase text-ink">
                  The console, alive
                </ProximityText>
              </div>
              <MonoLabel marker={false} className="text-signal">
                [ the frame you&apos;re reading is running it ]
              </MonoLabel>
            </div>
            <div className="grid gap-px overflow-hidden border border-line bg-line md:grid-cols-2">
              {live.map((m, i) => (
                <Reveal key={m.id} delay={i * 0.05} className="bg-void">
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
        <section
          data-tele-section="INDEX"
          className="border-b border-line px-6 py-24 sm:px-10"
        >
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
    </>
  );
}
