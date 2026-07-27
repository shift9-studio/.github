import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, projectSlugs } from "@/lib/work-details";
import s from "./work.module.css";

/* ────────────────────────────────────────────────────────────────────────
   A PROJECT PAGE.

   The last ten pages carrying the old chrome — CustomCursor, EdgeReticle,
   GridFrame, a telemetry rail, Signal cyan on every label, Void navy ground.
   That was the site's language when the site was one page. Everything else
   moved to black; these did not, so the pages meant to *be* the work read as
   the part of the site nobody had got to yet.

   Rebuilt on the same ground as /studio and /instrument. The one thing kept
   from the old version is the per-project accent, and it is now used far more
   sparingly: the number, the status word, the rule under the title, the
   feature numerals. Nothing else on the page carries colour, which is what
   makes it read as the project's own rather than as decoration.

   Deliberately gone, and not coming back here: the custom cursor (it replaced
   the visitor's own pointer on a page that is mostly reading), the reticle
   and grid frame (instrument chrome around content that is not an
   instrument), and the decode-scramble labels (a case study's section heads
   should be readable the instant they arrive).
   ──────────────────────────────────────────────────────────────────────── */

/* Prerender one static page per known project; 404 anything else. */
export function generateStaticParams() {
  return projectSlugs.map((slug) => ({ slug }));
}
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolved = getProject(slug);
  if (!resolved) return { title: "Project — Shift-9" };
  const { project, detail } = resolved;
  return {
    title: `${project.title} — Shift-9`,
    description: detail.tagline,
    openGraph: {
      title: `${project.title} — Shift-9`,
      description: detail.tagline,
      type: "article",
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resolved = getProject(slug);
  if (!resolved) notFound();
  const { project, detail, index } = resolved;
  const num = String(index + 1).padStart(2, "0");
  const accent = project.accent === "pulse" ? s.pulse : s.signal;

  return (
    <main className={`${s.root} ${accent}`}>
      {/* ─────────────────────────────── HEAD ─────────────────────────── */}
      <section className={`${s.wrap} ${s.head}`}>
        <div className={s.topRow}>
          <span className={s.num}>project file — {num}</span>
          {/* /studio, not /#work. There has never been an element with
              id="work" to land on, and / is the entrance now. */}
          <Link href="/studio" className={s.back}>
            ← all work
          </Link>
        </div>

        <h1 className={s.title}>{project.title}</h1>
        <p className={s.tagline}>{detail.tagline}</p>
        <div className={s.rule} aria-hidden />

        <div className={s.meta}>
          <span>{project.role}</span>
          <span className={s.metaSep} aria-hidden>
            /
          </span>
          <span>{project.year}</span>
          {project.status && (
            <>
              <span className={s.metaSep} aria-hidden>
                /
              </span>
              <span className={s.status}>{project.status}</span>
            </>
          )}
        </div>

        <ul className={s.tags}>
          {project.tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>

        {detail.external && (
          <div className={s.actions}>
            <a className="s9-pearl-dark" href={detail.external.href}>
              {detail.external.label}
            </a>
          </div>
        )}
      </section>

      {/* ─────────────────────────────── FILM ─────────────────────────── */}
      {project.videoUrl && (
        <section className={`${s.wrap} ${s.section}`}>
          <div className={s.film}>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              src={project.videoUrl}
              autoPlay
              muted
              loop
              playsInline
              aria-hidden
            />
          </div>
        </section>
      )}

      {/* ───────────────────────────── OVERVIEW ───────────────────────── */}
      <section className={`${s.wrap} ${s.section}`}>
        <div className={s.split}>
          <span className={s.label}>overview</span>
          <div className={s.prose}>
            {detail.overview.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────── FEATURES ───────────────────────── */}
      <section className={`${s.wrap} ${s.section}`}>
        <span className={s.label}>what it does</span>
        <div className={s.features}>
          {detail.features.map((f, i) => (
            <article key={f.title} className={s.feature}>
              <span className={s.featureNum}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className={s.featureTitle}>{f.title}</h2>
              <p className={s.featureBody}>{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ────────────────────────────── STACK ─────────────────────────── */}
      <section className={`${s.wrap} ${s.section}`}>
        <span className={s.label}>built with</span>
        <ul className={s.tags}>
          {detail.tech.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>

        <div className={s.actions}>
          {detail.external && (
            <a className="s9-pearl-dark" href={detail.external.href}>
              {detail.external.label}
            </a>
          )}
          <Link className="s9-pearl-dark" href="/studio">
            ← Back to the studio
          </Link>
          <Link className="s9-pearl" href="/start">
            Start a project →
          </Link>
        </div>
      </section>

      <footer className={`${s.wrap} ${s.foot}`}>
        <span>© 2026 Shift-9</span>
        <Link href="/" className={s.back}>
          the desktop →
        </Link>
      </footer>
    </main>
  );
}
