import type { Metadata } from "next";
import Link from "next/link";
import { MagneticButton, MonoLabel } from "@shift9/ui";
import { Reveal } from "../_components/Reveal";
import { PLAY_URL, PRICING, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Feelspoon pricing — free to cook, $4.99/mo for unlimited AI captures",
  description:
    "Feelspoon is free: save unlimited recipes, cook hands-free, plan the week and shop. Premium adds unlimited AI recipe captures for $4.99 a month or $39.99 a year.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Feelspoon pricing",
    description:
      "Free to save, cook, plan and shop. Premium adds unlimited AI recipe captures — $4.99 a month or $39.99 a year.",
    url: `${SITE_URL}/pricing`,
  },
};

const SAVING = Math.round((1 - PRICING.annual / (PRICING.monthly * 12)) * 100);

const INCLUDED_FREE = [
  "Unlimited saved recipes",
  "Import from a link, a photo, a screenshot or pasted text",
  "Hands-free cook mode — read-aloud steps, screen stays awake, built-in timers",
  "Scale any recipe to your servings, US cups or metric",
  "Weekly meal plan and a shopping list built from it",
  "Tags, search and bookmarks",
  "Works offline",
];

const INCLUDED_PREMIUM = [
  "Everything in Free",
  "Unlimited AI recipe captures — describe a dish or scan anything, as often as you like",
];

/* The category, in numbers, so nobody has to open five tabs to compare.
   Competitor prices are the ones named in the site audit's competitor
   research (Sep 2026); they are the other apps' prices, not ours, so check
   them before quoting them anywhere else. */
const CATEGORY = [
  {
    name: "Feelspoon",
    model: "Free · optional Premium",
    entry: "$0",
    full: "$4.99/mo or $39.99/yr",
    mine: true,
  },
  {
    name: "Paprika",
    model: "One-time, per platform",
    entry: "$4.99",
    full: "$4.99 per platform you use",
  },
  { name: "Samsung Food", model: "Free", entry: "$0", full: "Free" },
  {
    name: "Recipe Keeper",
    model: "Paid Pro",
    entry: "$19.99",
    full: "$19.99 Pro",
  },
  {
    name: "ReciBites",
    model: "Lifetime",
    entry: "$39.99",
    full: "$39.99 one-time",
  },
];

function Check() {
  return (
    <span aria-hidden className="shrink-0 leading-relaxed text-signal">
      ✓
    </span>
  );
}

export default function PricingPage() {
  return (
    <main className="relative px-6 pb-28 pt-20 sm:px-10">
      <div className="mx-auto max-w-[84rem]">
        <MonoLabel marker={false} decode className="mb-6">
          WHAT IT COSTS
        </MonoLabel>

        <h1
          className="max-w-4xl font-display text-h2 leading-[1.04] text-ink"
          style={{ fontVariationSettings: '"wght" 620' }}
        >
          Free to cook with.{" "}
          <span className="text-pulse">
            Pay only if you want the AI to do the typing.
          </span>
        </h1>

        <p className="mt-7 max-w-2xl text-body leading-relaxed text-muted">
          Every recipe feature is in the free app — saving, cook mode, scaling,
          the weekly plan and the shopping list. There is no trial
          clock and no card to enter. The one paid thing is unlimited AI
          captures.
        </p>

        {/* ── The two tiers ─────────────────────────────────────────── */}
        <div className="mt-14 grid gap-px overflow-hidden border border-line bg-line lg:grid-cols-2">
          <Reveal>
            <section className="flex h-full flex-col gap-6 bg-void p-8">
              <div className="flex items-baseline justify-between gap-4">
                <h2
                  className="font-display text-3xl text-ink"
                  style={{ fontVariationSettings: '"wght" 620' }}
                >
                  {PRICING.freeLabel}
                </h2>
                <MonoLabel marker={false}>start here</MonoLabel>
              </div>

              <p className="font-display text-h2 text-ink">$0</p>
              <p className="text-body leading-relaxed text-muted">
                {PRICING.freeBlurb}
              </p>

              <ul className="flex flex-col gap-3">
                {INCLUDED_FREE.map((i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-body leading-relaxed text-muted"
                  >
                    <Check />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-6">
                <MagneticButton href={PLAY_URL} target="_blank">
                  Get on Google Play
                </MagneticButton>
              </div>
            </section>
          </Reveal>

          <Reveal>
            {/* The one we point at, and why — a saffron edge, not a sales
                badge we cannot back up. "Most popular" is not claimed because
                there are no numbers behind it; "best value" is arithmetic. */}
            <section className="relative flex h-full flex-col gap-6 bg-well p-8 ring-1 ring-inset ring-signal/40">
              <div className="flex items-baseline justify-between gap-4">
                <h2
                  className="font-display text-3xl text-ink"
                  style={{ fontVariationSettings: '"wght" 620' }}
                >
                  {PRICING.premiumLabel}
                </h2>
                <MonoLabel marker={false} className="text-signal">
                  best value — yearly
                </MonoLabel>
              </div>

              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
                <p className="font-display text-h2 text-ink">
                  ${PRICING.annual.toFixed(2)}
                  <span className="text-body text-muted"> / year</span>
                </p>
                <p className="text-body text-muted">
                  or ${PRICING.monthly.toFixed(2)} / month
                </p>
              </div>

              <p className="text-body leading-relaxed text-muted">
                Yearly works out at ${PRICING.annualPerMonth.toFixed(2)} a month
                — {SAVING}% less than paying monthly, and $
                {PRICING.annualPerWeek.toFixed(2)} a week. Less than a coffee.
              </p>

              <ul className="flex flex-col gap-3">
                {INCLUDED_PREMIUM.map((i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-body leading-relaxed text-muted"
                  >
                    <Check />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>

              <p className="text-body leading-relaxed text-muted">
                Bought inside the app through Google Play, so it is cancelled in
                Google Play and refunded under Google&apos;s refund policy. Stop
                paying and you keep every recipe you saved.
              </p>

              <div className="mt-auto pt-6">
                <MagneticButton href={PLAY_URL} target="_blank">
                  Get the app, upgrade later
                </MagneticButton>
              </div>
            </section>
          </Reveal>
        </div>

        {/* ── The category, side by side ────────────────────────────── */}
        <section className="mt-24">
          <MonoLabel marker={false} decode className="mb-8">
            WHAT THE OTHERS CHARGE
          </MonoLabel>

          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[46rem] border-collapse text-left">
              <caption className="sr-only">
                Entry price and pricing model for Feelspoon and four other
                recipe apps
              </caption>
              <thead>
                <tr className="border-b border-line">
                  {["App", "Model", "To start", "Full price"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="p-5 font-mono text-mono uppercase tracking-[0.18em] text-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CATEGORY.map((c) => (
                  <tr
                    key={c.name}
                    className={`border-b border-line last:border-0 ${
                      c.mine ? "bg-well" : ""
                    }`}
                  >
                    <th
                      scope="row"
                      className={`p-5 font-display text-xl ${
                        c.mine ? "text-signal" : "text-ink"
                      }`}
                      style={{ fontVariationSettings: '"wght" 600' }}
                    >
                      {c.name}
                    </th>
                    <td className="p-5 text-body text-muted">{c.model}</td>
                    <td className="p-5 text-body text-ink">{c.entry}</td>
                    <td className="p-5 text-body text-muted">{c.full}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-5 max-w-2xl text-body leading-relaxed text-muted">
            Other apps&apos; prices as listed in September 2026. Paprika is a
            one-time purchase, which is cheaper than us over years if you only
            use one device — that is a fair reason to pick it. Read the{" "}
            <Link
              href="/vs/paprika"
              className="text-signal underline underline-offset-4 transition-premium hover:text-ink"
            >
              full comparison
            </Link>
            .
          </p>
        </section>

        <div className="mt-20 flex flex-wrap items-center gap-6">
          <MagneticButton href={PLAY_URL} target="_blank">
            Get on Google Play
          </MagneticButton>
          <Link
            href="/#faq"
            className="font-mono text-mono uppercase tracking-[0.18em] text-muted transition-premium hover:text-ink"
          >
            Questions first →
          </Link>
        </div>
      </div>
    </main>
  );
}
