import Link from "next/link";
import { MagneticButton, MonoLabel } from "@shift9/ui";
import { Reveal } from "../../_components/Reveal";
import { PLAY_URL } from "@/lib/site";

/* Shared shell for the comparison pages. One layout, two sets of facts, so a
   third comparison is a data file and not another page of markup.

   House rule for these pages: a row is either something we can point at, or it
   says "Not documented". Nothing about a competitor is guessed, and the honest
   reasons to choose them get their own section rather than a footnote. */

export type Row = {
  label: string;
  mine: string;
  theirs: string;
  /** true when the row is a plain win for us and should be marked as one. */
  edge?: boolean;
};

export type VsContent = {
  competitor: string;
  eyebrow: string;
  headline: string;
  headlineAccent: string;
  intro: string;
  rows: Row[];
  pickThem: { title: string; points: string[] };
  pickUs: { title: string; points: string[] };
  closing: string;
};

export function VsPage({ c }: { c: VsContent }) {
  return (
    <main className="relative px-6 pb-28 pt-20 sm:px-10">
      <div className="mx-auto max-w-[84rem]">
        <MonoLabel marker={false} decode className="mb-6">
          {c.eyebrow}
        </MonoLabel>

        <h1
          className="max-w-4xl font-display text-h2 leading-[1.04] text-ink"
          style={{ fontVariationSettings: '"wght" 620' }}
        >
          {c.headline} <span className="text-pulse">{c.headlineAccent}</span>
        </h1>

        <p className="mt-7 max-w-2xl text-body leading-relaxed text-muted">
          {c.intro}
        </p>

        {/* ── Side by side ──────────────────────────────────────────── */}
        <Reveal>
          <div className="mt-14 overflow-x-auto border border-line">
            <table className="w-full min-w-[46rem] border-collapse text-left">
              <caption className="sr-only">
                Feelspoon compared with {c.competitor}, feature by feature
              </caption>
              <thead>
                <tr className="border-b border-line">
                  <th
                    scope="col"
                    className="p-5 font-mono text-mono uppercase tracking-[0.18em] text-muted"
                  >
                    &nbsp;
                  </th>
                  <th
                    scope="col"
                    className="bg-well p-5 font-display text-xl text-signal"
                    style={{ fontVariationSettings: '"wght" 600' }}
                  >
                    Feelspoon
                  </th>
                  <th
                    scope="col"
                    className="p-5 font-display text-xl text-ink"
                    style={{ fontVariationSettings: '"wght" 600' }}
                  >
                    {c.competitor}
                  </th>
                </tr>
              </thead>
              <tbody>
                {c.rows.map((r) => (
                  <tr key={r.label} className="border-b border-line last:border-0">
                    <th
                      scope="row"
                      className="p-5 align-top font-mono text-mono uppercase tracking-[0.18em] text-muted"
                    >
                      {r.label}
                    </th>
                    <td className="bg-well p-5 align-top text-body text-ink">
                      {r.edge ? (
                        <span aria-hidden className="mr-2 text-signal">
                          ✓
                        </span>
                      ) : null}
                      {r.mine}
                    </td>
                    <td className="p-5 align-top text-body text-muted">
                      {r.theirs}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        {/* ── The honest split ──────────────────────────────────────── */}
        <div className="mt-20 grid gap-px overflow-hidden border border-line bg-line lg:grid-cols-2">
          <section className="bg-void p-8">
            <h2
              className="font-display text-3xl text-ink"
              style={{ fontVariationSettings: '"wght" 600' }}
            >
              {c.pickThem.title}
            </h2>
            <ul className="mt-6 flex flex-col gap-3">
              {c.pickThem.points.map((p) => (
                <li
                  key={p}
                  className="flex gap-3 text-body leading-relaxed text-muted"
                >
                  <span aria-hidden className="shrink-0 leading-relaxed text-muted">
                    —
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-well p-8">
            <h2
              className="font-display text-3xl text-ink"
              style={{ fontVariationSettings: '"wght" 600' }}
            >
              {c.pickUs.title}
            </h2>
            <ul className="mt-6 flex flex-col gap-3">
              {c.pickUs.points.map((p) => (
                <li
                  key={p}
                  className="flex gap-3 text-body leading-relaxed text-muted"
                >
                  <span aria-hidden className="shrink-0 leading-relaxed text-signal">
                    ✓
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <p className="mt-14 max-w-2xl text-body leading-relaxed text-muted">
          {c.closing}
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-6">
          <MagneticButton href={PLAY_URL} target="_blank">
            Get on Google Play
          </MagneticButton>
          <Link
            href="/pricing"
            className="font-mono text-mono uppercase tracking-[0.18em] text-muted transition-premium hover:text-ink"
          >
            See pricing →
          </Link>
          <Link
            href="/#faq"
            className="font-mono text-mono uppercase tracking-[0.18em] text-muted transition-premium hover:text-ink"
          >
            Common questions →
          </Link>
        </div>
      </div>
    </main>
  );
}
