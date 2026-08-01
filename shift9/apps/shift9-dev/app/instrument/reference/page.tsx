import Image from "next/image";
import Link from "next/link";
import { SET_PIECES } from "../../_components/studio-dolly-data";
import { CopyRow } from "../CopyRow";
import s from "../instrument.module.css";

/* ────────────────────────────────────────────────────────────────────────
   INSTRUMENT — the design system, on the ground the system actually uses.

   Rebuilt from a version that documented a site which no longer exists. It
   said the display face was Anybody (it is Bricolage Grotesque), that body
   copy was set in Martian Mono (it is Instrument Sans — the mono was demoted
   to labels for exactly the reason this page now states), and it listed a
   palette missing every token added since: the ink hierarchy, the pulse text
   value, and the whole invitation set. A design system page that is wrong
   about the design system is worse than no page, because it is the one page
   a reader is entitled to trust without checking.

   Two rules held throughout.

   Nothing is hardcoded. Every chip is painted with `background: var(--s9-…)`
   and the hex printed beside it is documentation of that variable, not the
   source of the colour. If the two ever disagree, the chip is right and the
   string is the bug — there is no second copy of the palette that can quietly
   fall out of date.

   Everything that highlights, copies. See CopyRow.
   ──────────────────────────────────────────────────────────────────────── */

export const metadata = {
  title: "INSTRUMENT Reference — Shift-9 Design System",
  description:
    "The technical token, type, motion, and component reference for the Shift-9 design system.",
};

type Swatch = { name: string; value: string; role: string };

const palette: { group: string; note: string; tokens: Swatch[] }[] = [
  {
    group: "Ground",
    note: "The surfaces everything else sits on.",
    tokens: [
      { name: "--s9-void", value: "#0f172a", role: "The base background" },
      { name: "--s9-void-2", value: "#0b1120", role: "Deeper well" },
      { name: "--s9-surface", value: "#131c31", role: "Raised panel" },
    ],
  },
  {
    group: "Ink",
    note:
      "Three steps, not two — a display face, running prose and a mono data label are three different jobs. Ratios are measured against the void: 14.48:1, 10.12:1, 6.96:1. The dim value used to be #64748b, which is 3.75:1 — under the 4.5:1 floor, and it was the value carrying the small mono labels, the worst case for it to fail on.",
    tokens: [
      { name: "--s9-ink", value: "#e2e8f0", role: "Primary text · 14.48:1" },
      { name: "--s9-ink-2", value: "#b8c4d6", role: "Running prose · 10.12:1" },
      { name: "--s9-ink-dim", value: "#94a3b8", role: "Labels, metadata · 6.96:1" },
    ],
  },
  {
    group: "Accent",
    note:
      "These were cyan and violet. Together on a dark ground they are the most recognisable colour scheme on the web right now, and reading as \u201ca dark site an AI helped build\u201d is the opposite of what a studio site is for. They are zero-chroma neutrals now: signal is the marker and the emphasis, brighter than the label it sits on; pulse is the secondary, for work that is unresolved, and it is dimmer than the prose on purpose.",
    tokens: [
      { name: "--s9-signal", value: "#e8edf5", role: "Emphasis, markers" },
      { name: "--s9-pulse", value: "#6f7b8f", role: "Secondary, unresolved" },
      { name: "--s9-pulse-ink", value: "#a9b4c4", role: "Secondary as text · 7.4:1" },
    ],
  },
  {
    group: "The invitation",
    note:
      "The one surface not built on the void. /start is true black with true white and no third colour in the ground at all. The green used to be on the button; it is on the email address now, and the button is pearl grey — so the one chromatic thing on the page is the address you can copy and act on in your own time. Scarcity is still what makes it land. The green also carries every focus ring, sitewide, because that is the one affordance a neutral could not say loudly enough.",
    tokens: [
      { name: "--s9-obsidian", value: "#000000", role: "True black — the ground" },
      { name: "--s9-chalk", value: "#ffffff", role: "True white · 21.00:1" },
      { name: "--s9-pearl", value: "#c9d1dc", role: "The primary control · black label at 14.7:1" },
      { name: "--s9-verdant", value: "#00e676", role: "The email, and every focus ring · 12.58:1" },
      { name: "--s9-verdant-lift", value: "#5cffa8", role: "Approached · 16.32:1" },
    ],
  },
  {
    group: "Materials",
    note:
      "Titanium gives the studio and Flow State a reflective neutral. Holofoil belongs to Flow State's standalone F, where one warm spectral material can carry the product identity without tinting the full interface.",
    tokens: [
      { name: "--s9-titanium", value: "layered reflection", role: "Polished neutral metal" },
      { name: "--s9-holofoil", value: "warm spectrum", role: "Flow State's F mark" },
      { name: "--s9-holofoil-fallback", value: "solid fallback", role: "Legible without text clipping" },
    ],
  },
];

const faces = [
  {
    key: "Display",
    token: "--s9-font-display",
    meta: "Bricolage Grotesque · variable opsz / wdth",
    cls: "specDisplay" as const,
    sample: "Design in motion.",
    body:
      "Headlines and the big numerals. Variable on optical size and width, which is what the proximity effect animates against and what pulls a headline toward the condensed direction the blueprint locks in.",
  },
  {
    key: "Heading",
    token: "--s9-font-display",
    meta: "Bricolage Grotesque · wght 600",
    cls: "specHeading" as const,
    sample: "Ship with confidence.",
    body:
      "Section heads. The same face one weight down, so a page reads as one voice at two volumes rather than as two typefaces.",
  },
  {
    key: "Text",
    token: "--s9-font-text",
    meta: "Instrument Sans · fluid 1rem → 1.13rem",
    cls: "specText" as const,
    sample: "One system. Every surface. No drift.",
    body:
      "Every sentence on the site. This role did not exist until recently — running prose was falling through to the monospace, so every paragraph on shift9.dev was set in a data face. A dark studio site typeset entirely in mono is the most templated look on the web, and the blueprint only ever called Martian Mono the terminal data face.",
  },
  {
    key: "Mono",
    token: "--s9-font-mono",
    meta: "Martian Mono · 0.82rem / tracking 0.22em",
    cls: "specMono" as const,
    sample: "SYS // ONLINE — BUILD: STABLE",
    body:
      "Labels, status, coordinates, counters, the // asides. What it is for, and only that.",
  },
];

const durations = [
  { token: "--s9-dur-fast", value: "140ms", role: "Micro — hovers, taps, icon nudges." },
  { token: "--s9-dur-base", value: "240ms", role: "Default — colour, border and opacity settles." },
  { token: "--s9-dur-slow", value: "480ms", role: "Entrances, reveals, larger displacements." },
  { token: "--s9-dur-boot", value: "720ms", role: "Power-on and page-transition choreography." },
  { token: "--s9-dur-tunnel", value: "420ms", role: "The dissolve — the desktop into the studio, and back up the other side." },
];

const easings = [
  {
    token: "--s9-ease-out",
    value: "cubic-bezier(0.16, 1, 0.3, 1)",
    role: "Decelerate — things arriving. The workhorse.",
  },
  {
    token: "--s9-ease-in",
    value: "cubic-bezier(0.7, 0, 0.84, 0)",
    role: "Accelerate — things leaving.",
  },
  {
    token: "--s9-ease-inout",
    value: "cubic-bezier(0.65, 0, 0.35, 1)",
    role: "Symmetric — moves that travel and stop on screen.",
  },
  {
    token: "--s9-ease-snap",
    value: "cubic-bezier(0.34, 1.4, 0.5, 1)",
    role: "Controlled overshoot — magnetic locks and toggles.",
  },
  {
    token: "--s9-ease-premium",
    value: "cubic-bezier(0.22, 1, 0.36, 1)",
    role: "The original house settle. Kept for the transition-premium utility and the pearl's lift — most hovers use ease-out.",
  },
];

const surfaces = [
  {
    route: "/",
    name: "The entrance",
    desc:
      "A held plate, a ~20 second film, then a skeuomorphic desktop. The one surface that deliberately leaves the system: it is a picture of an operating system, so it carries its own local light and dark palette rather than the void. Immersion at the seam outranks brand consistency there.",
    bar: ["var(--s9-void-2)", "var(--s9-signal)", "#eceadf", "#1f2328"],
  },
  {
    route: "/studio",
    name: "The reel",
    desc:
      "Twelve projects as one continuous scroll-driven take. Absolute black holds the frame, each set-piece is full-bleed and the type sits over it, and every project gets its own card variant so the twelve do not read as one template twelve times.",
    bar: ["var(--s9-obsidian)", "var(--s9-ink)", "var(--s9-signal)", "var(--s9-pulse)"],
  },
  {
    route: "/flow-state",
    name: "The product intake",
    desc:
      "A focused waitlist page for local Windows dictation. Titanium keeps the interface quiet, the standalone F carries warm holofoil, and one waveform demonstrates the capture state.",
    bar: [
      "var(--s9-obsidian)",
      "var(--s9-pearl)",
      "var(--s9-holofoil-fallback)",
      "var(--s9-ink-dim)",
    ],
  },
  {
    route: "/instrument",
    name: "The case study",
    desc:
      "A public explanation of how the system holds across Shift-9 Studio, Flow State, and Just a Pinch. The implementation catalog lives one level deeper at /instrument/reference.",
    bar: [
      "var(--s9-obsidian)",
      "var(--s9-titanium)",
      "var(--s9-holofoil-fallback)",
      "var(--s9-pearl)",
    ],
  },
  {
    route: "/start",
    name: "The invitation",
    desc:
      "One ask and one control. A canvas wave field sits behind pearl controls on true black. Verdant marks the email address and every focus ring.",
    bar: [
      "var(--s9-obsidian)",
      "var(--s9-chalk)",
      "var(--s9-pearl)",
      "var(--s9-verdant)",
    ],
  },
  {
    route: "/soon",
    name: "The gap",
    desc:
      "Where the projects without their own page land. One bit — black, white, and genuine 8×8 ordered dither as the only mid-tone — plus hazard tape, the one thing on that page allowed to carry colour.",
    bar: ["#0f0f0f", "#f5f5f5", "#f2c400", "#0f0f0f"],
  },
];

/* Checked against the packages rather than remembered. */
const shared = [
  { name: "WorkWall", desc: "Magnetic 3D tile grid — the project and recipe showcase. Rotation and perspective are desktop-only; phones get the flat layout." },
  { name: "DitherField", desc: "WebGL dithered noise field — a palette-driven animated hero background." },
  { name: "ProximityText", desc: "Variable-font weight and width driven by cursor distance." },
  { name: "MagneticButton", desc: "Spring-physics cursor-pull button." },
  { name: "GridFrame", desc: "Coordinate scaffold and corner ticks. `live` wakes its telemetry, `boot` plays the power-on." },
  { name: "TelemetryRail", desc: "The live readout that makes GridFrame an instrument — coordinates, scroll depth, section, FPS, sync." },
  { name: "GridSweep", desc: "WebGL feedback shader — the phosphor beam tracing the frame's hairline." },
  { name: "EdgeReticle", desc: "Spring-loaded viewfinder brackets that lock onto the focused control. Adds to the focus ring, never replaces it." },
  { name: "CustomCursor", desc: "Console cursor — dot, trailing ring, volumetric bloom." },
  { name: "DecodeText", desc: "Scramble-to-resolve text. SSR renders the final string, so there is no hydration mismatch and no layout shift." },
  { name: "MonoLabel", desc: "Mono uppercase section marker with an optional // marker." },
  { name: "Skeleton", desc: "Loading placeholders shaped like the layout that follows them." },
  { name: "SpiceMote", desc: "Just a Pinch's warm cursor — saffron and paprika motes that settle under gravity." },
  { name: "GrainField", desc: "Editorial film grain for the warm product surface." },
];

const hooks = [
  { name: "useReducedMotionSafe", desc: "The contract. Every animated component branches on this to a fully legible static state — never a paused half-state." },
  { name: "useInstrumentTelemetry", desc: "One rAF, one pointer listener, one IntersectionObserver, shared by everything that reads the machine." },
  { name: "useMagnetic", desc: "rAF-smoothed pointer pull. A MotionValue, never a per-event handler." },
  { name: "useProximityWeight", desc: "Cursor distance mapped onto variable-font axes." },
  { name: "useScrollVelocity", desc: "Smoothed scroll speed, for effects that respond to how fast you are moving." },
  { name: "springs", desc: "The house spring set, so two components that should feel the same do." },
];

const studioLocal = [
  { name: "EnterTheStudio", desc: "The entrance — front door, film, desktop, and the routes out of it." },
  { name: "StudioDolly", desc: "The reel — twelve set-pieces pinned and travelled by scroll." },
  { name: "AsciiWallpaper", desc: "The banner resampled to a live character grid, generated by scripts/build-ascii-art.py." },
  { name: "FadeToBlack", desc: "The desktop fading down on the way to the reel. The reel comes back up out of the same black — two halves of one dissolve, both on --s9-dur-tunnel." },
  { name: "WaveField", desc: "The canvas wave field behind /start. One path and one stroke per frame; quality steps down under load." },
  { name: "Shift9Mark", desc: "The mark — the 9 from the org icon, cut down the middle with the right half dropped and carrying opacity." },
  { name: "Reveal", desc: "Scroll-triggered fade and lift wrapper." },
];

export default function InstrumentReferencePage() {
  return (
    <main className={s.root}>
      <section className={`${s.wrap} ${s.hero}`}>
        <span className={s.label}>design system — instrument</span>
        <h1>
          One system.
          <br />
          <em>Every surface.</em>
        </h1>
        <p className={s.lede}>
          A living register of every Shift-9 project, followed by the tokens,
          type, motion and components that keep twelve different voices feeling
          like one studio.
        </p>
        <p className={s.note}>
          Each swatch reads the live custom property. The text beside it names
          the documented value and role. Press any row to copy the token.
        </p>
      </section>

      <section id="project-register" className={`${s.wrap} ${s.section} ${s.projectArchive}`}>
        <div className={s.archiveFrame}>
          <header className={s.archiveHeader}>
            <span className={s.label}>the project register</span>
            <span className={s.archiveCount} aria-hidden>
              {SET_PIECES.length.toString().padStart(2, "0")}
            </span>
            <h2 className={s.h2}>Twelve builds. One living archive.</h2>
            <p className={s.note}>
              Apps, games, product systems and studio infrastructure. This
              register grows with the work; every new project joins the same
              source that drives the studio reel.
            </p>
            <nav className={s.archiveNav} aria-label="Project register index">
              {SET_PIECES.map((project) => (
                <a
                  key={project.n}
                  href={`#project-${project.n}`}
                  aria-label={`Jump to ${project.title}`}
                  title={project.title}
                >
                  {project.n}
                </a>
              ))}
            </nav>
          </header>

          <div className={s.projectGrid}>
            {SET_PIECES.map((project) => {
              const href = project.href ?? "/soon";
              const isExternal = href.startsWith("http");
              const isComingSoon = href.startsWith("/soon");
              const isFeature = ["01", "02", "09", "10"].includes(project.n);

              return (
                <article
                  key={project.n}
                  id={`project-${project.n}`}
                  className={`${s.projectCard} ${isFeature ? s.projectFeature : ""}`}
                >
                  <Link
                    href={href}
                    className={s.projectMedia}
                    aria-label={`${isComingSoon ? "View status for" : "Open"} ${project.title}`}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noreferrer" : undefined}
                  >
                    <Image
                      src={project.plate}
                      alt=""
                      fill
                      sizes={isFeature ? "(min-width: 64rem) 62vw, 100vw" : "(min-width: 64rem) 31vw, 100vw"}
                      className={s.projectImage}
                    />
                    <span className={s.projectShade} aria-hidden />
                    <span className={s.projectScan} aria-hidden />
                    <span className={s.projectCorner} aria-hidden>
                      {project.card}
                    </span>
                  </Link>

                  <div className={s.projectCopy}>
                    <div className={s.projectMeta}>
                      <span>{project.n}</span>
                      <span>{project.status}</span>
                    </div>
                    <h3>
                      <Link
                        href={href}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noreferrer" : undefined}
                      >
                        {project.title}
                      </Link>
                    </h3>
                    <p>{project.note}</p>
                    <div className={s.projectTags} aria-label="Project technologies">
                      {project.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                    <div className={s.projectActions}>
                      <Link
                        href={href}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noreferrer" : undefined}
                      >
                        {isComingSoon ? "View build status" : "Open project"} →
                      </Link>
                      {project.appHref ? (
                        <Link href={project.appHref} target="_blank" rel="noreferrer">
                          {project.appLabel ?? "Open app"} ↗
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {palette.map((group) => (
        <section key={group.group} className={`${s.wrap} ${s.section}`}>
          <span className={s.label}>tokens — {group.group.toLowerCase()}</span>
          <h2 className={s.h2}>{group.group}</h2>
          <p className={s.note}>{group.note}</p>
          <div className={s.swatches}>
            {group.tokens.map((t) => (
              <div key={t.name} className={s.swatch}>
                <CopyRow value={`var(${t.name})`} label={t.name} hint="copy var">
                  <span
                    className={s.chip}
                    style={{ background: `var(${t.name})` }}
                    aria-hidden
                  />
                  <span className={s.swatchMeta}>
                    <span className={s.tokenName}>{t.name}</span>
                    <span className={s.tokenValue}>{t.value}</span>
                    <span className={s.tokenRole}>{t.role}</span>
                  </span>
                </CopyRow>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className={`${s.wrap} ${s.section}`}>
        <span className={s.label}>tokens — type</span>
        <h2 className={s.h2}>Type roles</h2>
        <p className={s.note}>
          A display face, a reading face and a data face. Each specimen is set in
          the thing it documents.
        </p>
        <div className={s.rows}>
          {faces.map((f) => (
            <div key={f.key} className={s.row}>
              <CopyRow
                value={`var(${f.token})`}
                label={`${f.key} — ${f.token}`}
                hint="copy var"
              >
                <span className={s.rowInner}>
                  <span className={s.rowKey}>{f.key}</span>
                  <span>
                    <span className={s[f.cls]}>{f.sample}</span>
                    <span className={s.rowBody}>{f.body}</span>
                  </span>
                  <span className={s.rowMeta}>{f.meta}</span>
                </span>
              </CopyRow>
            </div>
          ))}
        </div>
      </section>

      <section className={`${s.wrap} ${s.section}`}>
        <span className={s.label}>tokens — motion</span>
        <h2 className={s.h2}>A tempo, not a speed</h2>
        <p className={s.note}>
          Duration is chosen by the size of the move: a hover is not an entrance,
          and an entrance is not a page transition. Every animated component
          branches on useReducedMotionSafe() and degrades to a complete,
          readable static state.
        </p>
        <div className={s.rows}>
          {[...durations, ...easings].map((m) => (
            <div key={m.token} className={s.row}>
              <CopyRow value={`var(${m.token})`} label={m.token} hint="copy var">
                <span className={s.rowInner}>
                  <span className={s.rowKey}>{m.value}</span>
                  <span className={s.rowBody}>{m.role}</span>
                  <span className={s.rowMeta}>{m.token}</span>
                </span>
              </CopyRow>
            </div>
          ))}
        </div>
      </section>

      <section className={`${s.wrap} ${s.section}`}>
        <span className={s.label}>the surfaces</span>
        <h2 className={s.h2}>Current studio rooms</h2>
        <p className={s.note}>
          Same tokens, same motion contract, same components. What changes is
          what each room is for — and a system is only worth having if it can
          say where it is allowed to break.
        </p>
        <div className={s.surfaces}>
          {surfaces.map((f) => (
            <div key={f.route} className={s.surface}>
              <span className={s.surfaceRoute}>{f.route}</span>
              <span className={s.surfaceName}>{f.name}</span>
              <span className={s.surfaceDesc}>{f.desc}</span>
              <span className={s.surfaceBar} aria-hidden>
                {f.bar.map((c, i) => (
                  <span key={i} style={{ background: c }} />
                ))}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className={`${s.wrap} ${s.section}`}>
        <span className={s.label}>@shift9/ui</span>
        <h2 className={s.h2}>Shared components</h2>
        <p className={s.note}>
          Importable from any surface. Press a row to copy its import.
        </p>
        <div className={s.rows}>
          {shared.map((c) => (
            <div key={c.name} className={s.row}>
              <CopyRow
                value={`import { ${c.name} } from "@shift9/ui";`}
                label={`the import for ${c.name}`}
                hint="copy import"
              >
                <span className={s.rowInner}>
                  <span className={s.rowKey}>{c.name}</span>
                  <span className={s.rowBody}>{c.desc}</span>
                  <span className={s.rowMeta}>@shift9/ui</span>
                </span>
              </CopyRow>
            </div>
          ))}
        </div>
      </section>

      <section className={`${s.wrap} ${s.section}`}>
        <span className={s.label}>@shift9/motion</span>
        <h2 className={s.h2}>Hooks</h2>
        <div className={s.rows}>
          {hooks.map((c) => (
            <div key={c.name} className={s.row}>
              <CopyRow
                value={`import { ${c.name} } from "@shift9/motion";`}
                label={`the import for ${c.name}`}
                hint="copy import"
              >
                <span className={s.rowInner}>
                  <span className={s.rowKey}>{c.name}</span>
                  <span className={s.rowBody}>{c.desc}</span>
                  <span className={s.rowMeta}>@shift9/motion</span>
                </span>
              </CopyRow>
            </div>
          ))}
        </div>
      </section>

      <section className={`${s.wrap} ${s.section}`}>
        <span className={s.label}>studio-local</span>
        <h2 className={s.h2}>Not shared, on purpose</h2>
        <p className={s.note}>
          These live in the studio app rather than the package. They are built
          around this site&rsquo;s own content — its wallpaper, its roster, its
          front door — and exporting them would mean pretending they are general
          when they are not.
        </p>
        <div className={s.rows}>
          {studioLocal.map((c) => (
            <div key={c.name} className={s.row}>
              <span className={s.rowInner}>
                <span className={s.rowKey}>{c.name}</span>
                <span className={s.rowBody}>{c.desc}</span>
                <span className={s.rowMeta}>app/_components</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <footer className={`${s.wrap} ${s.foot}`}>
        <Link href="/instrument" className={s.back}>
          ← Instrument case study
        </Link>
        <Link href="/start" className="s9-pearl">
          Start a project →
        </Link>
      </footer>
    </main>
  );
}
