import Image from "next/image";
import Link from "next/link";
import { LabSurface } from "./LabSurface";
import { instrumentProjects } from "./instrument-projects";
import s from "./case-study.module.css";

export const metadata = {
  title: "INSTRUMENT — The Shift-9 Design System",
  description:
    "See how Shift-9 carries one accessibility and interaction contract across distinct products without flattening their identities.",
};

const sharedRules = [
  "Type has a display, reading, and data role.",
  "Focus stays visible on every control.",
  "Motion can switch off without hiding content.",
  "Phone layouts are designed as finished states.",
];

export default function InstrumentPage() {
  return (
    <main className={s.root}>
      <a className={`s9-pearl-dark s9-pearl-ghost ${s.exitPin}`} href="/studio#set-09">
        &#8592; The studio
      </a>

      <header className={s.hero}>
        <LabSurface className={s.heroBench}>
          <div className={s.heroMedia} aria-hidden="true" />
          <div className={s.heroScrim} aria-hidden="true" />
          <div className={s.scanBeam} aria-hidden="true" />

          <div className={s.heroCopy}>
            <p className={s.eyebrow}>Open lab / Instrument</p>
            <h1>
              The system, left open <span>on the bench.</span>
            </h1>
            <p className={s.lede}>
              Instrument is Shift-9&apos;s working design lab: the decisions,
              parts, and product evidence behind the studio&apos;s live surfaces.
            </p>
            <div className={s.heroActions}>
              <Link className="s9-pearl" href="#proof">
                Open the drawers
              </Link>
              <Link className="s9-pearl-dark" href="/instrument/reference">
                Open the system index &#8594;
              </Link>
            </div>
          </div>

          <div className={s.heroNotes} aria-hidden="true">
            <p>Bench 09 / active</p>
            <span>Interaction contract</span>
            <span>Material studies</span>
            <span>Production evidence</span>
          </div>
          <p className={s.scrollCue}>Move to inspect / Scroll for drawers</p>
        </LabSurface>
      </header>

      <section className={s.productSection} id="proof">
        <div className={s.sectionIntro}>
          <p className={s.eyebrow}>Drawer index / live specimens</p>
          <h2>Pull the drawers. The evidence is live.</h2>
          <p>
            Each product keeps its own material and voice. Underneath, the same
            rules hold focus, motion, type, and small screens together.
          </p>
        </div>

        <div className={s.studies}>
          {instrumentProjects.map((project, index) => (
            <article className={s.study} key={project.name}>
              <div
                className={s.studyVisual}
                aria-hidden="true"
              >
                <Image
                  className={s.studyImage}
                  src={project.image}
                  alt=""
                  fill
                  sizes="(max-width: 44rem) 100vw, 92vw"
                />
                <span className={s.frameIndex}>{project.specimenLabel}</span>
              </div>
              <div className={s.studyCopy}>
                <p className={s.studyLabel}>{project.name}</p>
                <h3>{project.headline}</h3>
                <p className={s.studyDescription}>{project.description}</p>
                {"external" in project && project.external ? (
                  <a href={project.href}>{project.action}</a>
                ) : (
                  <Link href={project.href}>{project.action}</Link>
                )}
                <span className={s.drawerNumber} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={s.contractSection}>
        <div className={s.sectionIntro}>
          <p className={s.eyebrow}>Operating contract</p>
          <h2>Four rules survive every experiment.</h2>
        </div>

        <div className={s.contractGrid}>
          <div>
            <p className={s.contractLabel}>Shared underneath</p>
            <ul>
              {sharedRules.map((rule, index) => (
                <li key={rule}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className={s.contractLabel}>Specific on the surface</p>
            <dl>
              {instrumentProjects.map((product) => (
                <div key={product.name}>
                  <dt>{product.name}</dt>
                  <dd>{product.surfaceNote}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className={s.boundarySection}>
        <p className={s.eyebrow}>The boundary</p>
        <div className={s.boundaryCopy}>
          <h2>Instrument documents how Shift-9 builds its own products.</h2>
          <p>
            Instrument gives clients and partners a clear view of the decisions
            behind shipped Shift-9 work: structure, motion, interaction, and the
            evidence supporting each choice. Titanium Forge is the separate
            component workbench built from those lessons.
          </p>
        </div>
      </section>

      <section className={s.referenceSection}>
        <div className={s.referenceObject} aria-hidden="true" />
        <div className={s.referenceGrid} aria-hidden="true" />
        <div className={s.referenceCopy}>
          <p className={s.eyebrow}>Drawer 04 / technical reference</p>
          <h2>The system index is ready.</h2>
          <p>
            Inspect the live tokens, type roles, motion timings, shared
            components, and studio-local pieces.
          </p>
          <div className={s.referenceActions}>
            <Link className="s9-pearl" href="/instrument/reference">
              Open technical reference &#8594;
            </Link>
          </div>
        </div>
      </section>

      <footer className={s.footer}>
        <Link className="s9-pearl-dark" href="/studio">
          &#8592; View the work
        </Link>
        <Link className="s9-pearl" href="/start">
          Start a project &#8594;
        </Link>
      </footer>
    </main>
  );
}
