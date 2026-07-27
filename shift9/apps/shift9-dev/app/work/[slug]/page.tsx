import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CustomCursor,
  EdgeReticle,
  GridFrame,
  MagneticButton,
  MonoLabel,
  ProximityText,
} from "@shift9/ui";
import { Reveal, RevealGroup, RevealItem } from "@/app/_components/Reveal";
import { getProject, projectSlugs } from "@/lib/work-details";

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
  const accent = project.accent === "pulse" ? "text-pulse" : "text-signal";

  return (
    <>
      <CustomCursor />
      <EdgeReticle />
      <main className="relative">
        <GridFrame coord={`X:WORK · Y:${num}`} live boot />

        {/* ─────────────────────────── HEADER ───────────────────────── */}
        <section
          data-tele-section="PROJECT"
          className="border-b border-line px-6 pb-20 pt-28 sm:px-10"
        >
          <div className="mx-auto max-w-[84rem]">
            <div className="mb-8 flex items-center justify-between gap-4">
              <MonoLabel decode>{`// project file — ${num}`}</MonoLabel>
              {/* /studio, not /#work. There has never been an element with
                  id="work" on the root, so the old anchor resolved to nothing
                  — and now that / is the entrance, following it dropped a
                  deep-linked visitor at the front door. /studio is the work:
                  all twelve projects as one continuous take. No fragment,
                  because the dolly maps scroll position to frame and an
                  anchor jump would land mid-take with no context. */}
              <a
                href="/studio"
                className="font-mono text-mono uppercase tracking-[0.18em] text-signal opacity-60 transition-premium hover:opacity-100 hover:[filter:drop-shadow(0_0_6px_#22d3ee)]"
              >
                ← all work
              </a>
            </div>

            <ProximityText
              as="h1"
              className="text-display uppercase tracking-[-0.02em] text-ink"
            >
              {project.title}
            </ProximityText>

            <p className="mt-6 max-w-2xl text-lead leading-relaxed text-ink">
              {detail.tagline}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-mono uppercase tracking-[0.18em] text-muted">
              <span>{project.role}</span>
              <span aria-hidden className="text-line">
                /
              </span>
              <span>{project.year}</span>
              {project.status && (
                <>
                  <span aria-hidden className="text-line">
                    /
                  </span>
                  <span className={accent}>{project.status}</span>
                </>
              )}
            </div>

            <ul className="mt-6 flex flex-wrap gap-1.5">
              {project.tags.map((t) => (
                <li
                  key={t}
                  className="border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted"
                >
                  {t}
                </li>
              ))}
            </ul>

            {detail.external && (
              <div className="mt-10">
                <MagneticButton href={detail.external.href}>
                  {detail.external.label}
                </MagneticButton>
              </div>
            )}
          </div>
        </section>

        {/* ─────────────────────────── TEASER ───────────────────────── */}
        {project.videoUrl && (
          <section className="border-b border-line px-6 py-20 sm:px-10">
            <div className="mx-auto max-w-[84rem]">
              <div className="relative aspect-[16/9] w-full overflow-hidden border border-line bg-well">
                <video
                  className="h-full w-full object-cover opacity-80 motion-reduce:hidden"
                  src={project.videoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  aria-hidden
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/70 via-transparent to-transparent" />
              </div>
            </div>
          </section>
        )}

        {/* ────────────────────────── OVERVIEW ──────────────────────── */}
        <section
          data-tele-section="OVERVIEW"
          className="border-b border-line px-6 py-24 sm:px-10"
        >
          <div className="mx-auto grid max-w-[84rem] gap-10 lg:grid-cols-[1fr_2fr]">
            <MonoLabel decode className="lg:pt-2">
              // overview
            </MonoLabel>
            <div className="space-y-6">
              {detail.overview.map((para, i) => (
                <Reveal key={i} delay={i * 0.06}>
                  <p
                    className={
                      i === 0
                        ? "text-lead leading-relaxed text-ink"
                        : "text-body leading-relaxed text-muted"
                    }
                  >
                    {para}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ──────────────────── FUNCTIONS & FEATURES ────────────────── */}
        <section
          data-tele-section="FEATURES"
          className="border-b border-line px-6 py-24 sm:px-10"
        >
          <div className="mx-auto max-w-[84rem]">
            <MonoLabel decode className="mb-14">
              // functions & features
            </MonoLabel>
            <RevealGroup className="grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {detail.features.map((f, i) => (
                <RevealItem key={f.title} variant="scan" className="bg-void">
                  <article className="flex h-full flex-col gap-4 p-8 transition-premium hover:bg-well">
                    <span className="font-mono text-mono text-signal">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3
                      className="font-display text-2xl text-ink"
                      style={{ fontVariationSettings: '"wght" 640, "wdth" 110' }}
                    >
                      {f.title}
                    </h3>
                    <p className="text-body leading-relaxed text-muted">
                      {f.body}
                    </p>
                  </article>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>

        {/* ───────────────────────── STACK + CTA ────────────────────── */}
        <section
          data-tele-section="STACK"
          className="px-6 py-24 sm:px-10"
        >
          <div className="mx-auto max-w-[84rem]">
            <MonoLabel decode className="mb-8">
              // stack
            </MonoLabel>
            <ul className="flex flex-wrap gap-2">
              {detail.tech.map((t) => (
                <li
                  key={t}
                  className="border border-line px-3 py-1 font-mono text-mono uppercase tracking-[0.16em] text-muted"
                >
                  {t}
                </li>
              ))}
            </ul>

            <div className="mt-12 flex flex-wrap items-center gap-4">
              {detail.external && (
                <MagneticButton href={detail.external.href}>
                  {detail.external.label}
                </MagneticButton>
              )}
              <MagneticButton href="/studio" variant="ghost">
                Back to the studio
              </MagneticButton>
            </div>
          </div>
        </section>

        {/* ─────────────────────────── FOOTER ───────────────────────── */}
        <footer className="border-t border-line px-6 py-10 sm:px-10">
          <div className="mx-auto flex max-w-[84rem] flex-wrap items-center justify-between gap-4">
            <MonoLabel marker={false}>© 2026 SHIFT-9 — built in motion</MonoLabel>
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
