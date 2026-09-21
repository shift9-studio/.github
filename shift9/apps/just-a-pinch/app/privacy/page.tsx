import type { Metadata } from "next";
import Link from "next/link";
import { MonoLabel } from "@shift9/ui";
import { PLAY_URL, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Feelspoon privacy — what we store, and what we don't sell",
  description:
    "Plain-words summary of what Feelspoon collects: your account, your recipes, and crash logs. We don't sell your data and we don't run ad tracking. Delete your account and it all goes.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Feelspoon privacy",
    description:
      "What Feelspoon stores, who it goes to, and how to delete all of it.",
    url: `${SITE_URL}/privacy`,
  },
};

/* The short version of the app's published privacy policy (last updated
   29 July 2026), written for someone deciding whether to type their email in
   the box on the homepage. Everything here is taken from that policy — if the
   policy changes, change this to match; the policy is the one that governs. */

const SECTIONS = [
  {
    h: "What we store",
    body: [
      "Your account: email address, the name you enter, and a password held by our authentication provider — never in plain text.",
      "Your content: the recipes, meal plans, shopping lists and preferences you create.",
      "What you hand the importer: the link you paste, the text you paste, or the photo you scan, so it can be turned into a recipe.",
      "Crash logs and basic device information when something breaks, so it can be fixed.",
    ],
  },
  {
    h: "What we never do",
    body: [
      "We do not sell your data.",
      "We do not run advertising or cross-app tracking.",
      "Google Play's own data-safety card says the same: no data shared with third parties.",
    ],
  },
  {
    h: "Who else touches it",
    body: [
      "Supabase holds your account and synced content.",
      "Anthropic's API reads the link, text, photo or prompt when you import or generate a recipe. It is not used to train their models.",
      "Pexels supplies a stock photo when a recipe has none of its own.",
      "Sentry receives crash logs so errors can be traced.",
      "Instacart receives nothing from us — the list is copied to your clipboard and you paste it yourself.",
    ],
  },
  {
    h: "Getting rid of it",
    body: [
      "Settings → Account → Delete account erases your account and everything attached to it, from the servers and from your device. It cannot be undone.",
      "Everything is encrypted in transit, and row-level access rules mean your data is reachable only by you.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="relative px-6 pb-28 pt-20 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <MonoLabel decode className="mb-6">
          PRIVACY, IN PLAIN WORDS
        </MonoLabel>

        <h1
          className="font-display text-h2 leading-[1.05] text-ink"
          style={{ fontVariationSettings: '"wght" 620' }}
        >
          We don&apos;t sell your data.{" "}
          <span className="text-pulse">Here&apos;s what we store.</span>
        </h1>

        <p className="mt-7 text-body leading-relaxed text-muted">
          This is the short version of the app&apos;s privacy policy, last
          updated 29 July 2026. The policy is what governs; this page exists so
          you can decide about the email box without reading all of it.
        </p>

        <div className="mt-14 flex flex-col gap-12">
          {SECTIONS.map((s) => (
            <section key={s.h}>
              <h2
                className="font-display text-3xl text-ink"
                style={{ fontVariationSettings: '"wght" 600' }}
              >
                {s.h}
              </h2>
              <ul className="mt-5 flex flex-col gap-3">
                {s.body.map((b) => (
                  <li
                    key={b}
                    className="flex gap-3 text-body leading-relaxed text-muted"
                  >
                    <span aria-hidden className="shrink-0 leading-relaxed text-signal">
                      —
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section>
            <h2
              className="font-display text-3xl text-ink"
              style={{ fontVariationSettings: '"wght" 600' }}
            >
              Asking us about it
            </h2>
            <p className="mt-5 text-body leading-relaxed text-muted">
              Email{" "}
              <a
                href="mailto:kariimchiles@gmail.com"
                className="text-signal underline underline-offset-4 transition-premium hover:text-ink"
              >
                kariimchiles@gmail.com
              </a>
              . The{" "}
              <a
                href={PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-signal underline underline-offset-4 transition-premium hover:text-ink"
              >
                Google Play listing
              </a>{" "}
              carries the same declarations, checked by Google.
            </p>
          </section>
        </div>

        <p className="mt-16 text-body text-muted">
          <Link
            href="/"
            className="font-mono text-mono uppercase tracking-[0.18em] transition-premium hover:text-ink"
          >
            ← Back to Feelspoon
          </Link>
        </p>
      </div>
    </main>
  );
}
