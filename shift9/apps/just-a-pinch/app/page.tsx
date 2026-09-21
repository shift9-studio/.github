import {
  DitherField,
  GrainField,
  MagneticButton,
  MonoLabel,
  SpiceMote,
  WorkWall,
  type DitherPalette,
} from "@shift9/ui";
import Link from "next/link";
import { getFeaturedBoard } from "@shift9/data";
import { Reveal, RevealGroup, RevealItem } from "./_components/Reveal";
import { SeasonHeadline } from "./_components/SeasonHeadline";
import { ParallaxImage } from "./_components/ParallaxImage";
import { WaitlistForm } from "./_components/WaitlistForm";
import { Phone, PhoneShowcase } from "./_components/PhoneShowcase";
import { PlayProof } from "./_components/PlayProof";
import { Differentiator } from "./_components/Differentiator";
import { Faq } from "./_components/Faq";
import { Testimonials } from "./_components/Testimonials";
import { FounderNote } from "./_components/FounderNote";
import { PLAY_URL, PRICING, WEB_APP_URL } from "@/lib/site";
import { board as fallbackBoard } from "@/lib/menu-data";

/* ISR — refresh the featured recipes hourly. The page stays static + instant;
   the showcase updates without a redeploy. */
export const revalidate = 3600;

/* Warm re-skin of the shared dither hero — saffron resolving to paprika.
   Same shader, different surface. */
const warm: DitherPalette = {
  base: "#1b1410",
  signal: "#f5a524",
  pulse: "#e8633a",
};

const steps = [
  {
    id: "01",
    title: "Save",
    body: "Clip a recipe from a link, snap a photo, or type your own. It all lands in one tidy place — no more lost screenshots and seventeen open tabs.",
  },
  {
    id: "02",
    title: "Organize",
    body: "Tag, sort, and search by ingredient, cuisine, or craving. The recipe you're after is two taps away, not buried in your camera roll.",
  },
  {
    id: "03",
    title: "Cook",
    body: "Step-by-step cook mode, scaled to your servings and timed to your night. No ten-paragraph life story. Just dinner, handled.",
  },
];

/* The "Smart swaps" card was removed on 19 Sep 2026: the app has no
   ingredient-substitution feature, so the card was advertising something that
   does not exist. Meal planning takes the slot, because it IS a headline
   feature and was only appearing in a screenshot caption. */
const features = [
  {
    k: "your pantry",
    t: "All in one place",
    b: "Every recipe — links, photos, screenshots, your own — in a single searchable home you'll actually keep using.",
  },
  {
    k: "for the crowd",
    t: "Scaled to taste",
    b: "One quiet dinner or a full table — quantities and timings recalculate themselves.",
  },
  {
    k: "just cook",
    t: "Cook mode",
    b: "Hands-free, step-by-step guidance in big text. It reads each step aloud, keeps the screen awake, and has timers built into the steps that need them.",
  },
  {
    k: "the week ahead",
    t: "Plan and shop",
    b: "Build your week, then generate a shopping list from it. Less forgetting, fewer extra trips.",
  },
];

export default async function Home() {
  // A sample of featured recipes from Supabase; static seed if not configured.
  const board = (await getFeaturedBoard(6)) ?? fallbackBoard;

  return (
    <>
    {/* Warm, food-forward signatures — distinct from the studio's cyber
        console: a "pinch of spice" cursor and an editorial cookbook grain. */}
    <GrainField />
    <SpiceMote />
    <main className="relative">

      {/* ─────────────────────────── HERO ─────────────────────────── */}
      <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-6 pb-16 pt-24 sm:px-10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          {/* Higgsfield food photo — editorial overhead dinner spread, with a
              slow scroll parallax for depth behind the warm Dither. Hosted
              here as WebP: the Higgsfield original is a 2 MB PNG. */}
          <ParallaxImage
            src="/hero/dinner.webp"
            className="h-full w-full object-cover"
          />
          <DitherField palette={warm} className="absolute inset-0 h-full w-full opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-void/60 via-void/40 to-void" />
        </div>

        <div className="mx-auto grid w-full max-w-[84rem] items-center gap-16 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          {/* The h1 keeps its hook; the badge above it does the categorising,
              so category, audience and platform are all read inside the first
              few words instead of only living in the title tag. */}
          {/* alignItems inline: on a phone this wraps to two lines, and the
              shared label centres its "//" marker, which would leave the
              marker floating beside the middle of the block. */}
          <MonoLabel marker={false}
            decode
            className="mb-8"
            style={{ alignItems: "flex-start" }}
          >
            RECIPE ORGANIZER FOR HOME COOKS · ANDROID + BROWSER · LIVE ON GOOGLE PLAY
          </MonoLabel>

          <SeasonHeadline
            as="h1"
            className="text-display uppercase tracking-[-0.02em] text-ink"
            lines={[
              { text: "Every recipe." },
              { text: "Finally cooked.", accent: true },
            ]}
          />

          <p className="mt-6 max-w-xl text-body leading-relaxed text-muted">
            Feelspoon keeps every recipe you love in one place — then walks
            you through cooking it. Scaled to your servings, whether it arrived
            as a link, a screenshot or a photo of a card. The recipes you save are the
            ones you&apos;ll <span className="text-ink">actually</span> make.
          </p>

          {/* Two ways in, side by side and the same height: the official
              Google Play badge (Google's own artwork, unaltered, served from
              Google) and the browser version for everyone not on Android. */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={PLAY_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Get it on Google Play"
              className="-my-3 -ml-3 block transition-premium hover:opacity-90"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                alt="Get it on Google Play"
                width={646}
                height={250}
                className="block h-[80px] w-auto"
              />
            </a>
            <MagneticButton href={WEB_APP_URL}>Open it in your browser</MagneticButton>
            <a
              href="#how"
              className="font-mono text-mono uppercase tracking-[0.18em] text-muted underline underline-offset-4 transition-premium hover:text-ink"
            >
              See how it works ↓
            </a>
          </div>

          {/* What it costs, before the click — the audience's top objection is
              not knowing. Figures come from lib/site.ts, which mirrors the
              Play listing. */}
          <p className="mt-6 max-w-xl text-body leading-relaxed text-muted">
            <span className="text-ink">Free to download, free to cook with.</span>{" "}
            No card, no trial clock. Premium adds unlimited AI captures for $
            {PRICING.monthly.toFixed(2)} a month or ${PRICING.annual.toFixed(2)}{" "}
            a year —{" "}
            <Link
              href="/pricing"
              className="text-signal underline underline-offset-4 transition-premium hover:text-ink"
            >
              see what&apos;s in each
            </Link>
            .
          </p>

          {/* Who it is not for, said plainly, so nobody installs it expecting
              something else. */}
          <p className="mt-3 max-w-xl text-body leading-relaxed text-muted">
            Made for home cooks, not restaurant kitchens. No iPhone app yet: on
            an iPhone, use the browser version.
          </p>
        </div>

        {/* The product itself above the fold, not only the food. Wide screens
            only; on a phone the hero is already a full screen of text. */}
        <div className="hidden lg:block">
          <Phone
            src="/screens/cook"
            alt="Feelspoon app — Cook hands-free: step-by-step cooking mode with the screen awake and built-in timers."
            eager
          />
        </div>
        </div>

        <div className="pointer-events-none absolute bottom-10 right-6 hidden sm:right-10 sm:block">
          <MonoLabel marker={false}>
            <span className="text-signal">↓</span>&nbsp;&nbsp;scroll —{" "}
            {board.length} recipes inside
          </MonoLabel>
        </div>
      </section>

      {/* ──────────────────── THIRD-PARTY PROOF (when real) ───────── */}
      <PlayProof />

      {/* ────────────────────────── MANIFESTO ─────────────────────── */}
      <section className="border-y border-line px-6 py-24 sm:px-10">
        <div className="mx-auto grid max-w-[84rem] gap-10 lg:grid-cols-[1fr_2fr]">
          <MonoLabel marker={false} decode className="lg:pt-3">THE STORY</MonoLabel>
          <Reveal>
            <p
              className="font-display text-h2 leading-[1.05] text-ink"
              style={{ fontVariationSettings: '"wght" 580' }}
            >
              Your recipes shouldn&apos;t live in screenshots, bookmarks, and
              tabs you&apos;ll never find again. Keep them in one place —{" "}
              <span className="text-pulse">and a pinch of taste.</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ───────────────────────── HOW IT WORKS ───────────────────── */}
      <section id="how" className="scroll-mt-20 px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-[84rem]">
          <MonoLabel marker={false} decode className="mb-14">FROM SAVED TO SERVED</MonoLabel>
          <RevealGroup className="grid gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
            {steps.map((s) => (
              <RevealItem key={s.id} variant="scan" className="bg-void">
                <article className="flex h-full flex-col gap-5 p-8 transition-premium hover:bg-well">
                  <span className="font-mono text-mono text-signal">
                    {s.id}
                  </span>
                  <h3
                    className="font-display text-3xl text-ink"
                    style={{ fontVariationSettings: '"wght" 620' }}
                  >
                    {s.title}
                  </h3>
                  <p className="text-body leading-relaxed text-muted">
                    {s.body}
                  </p>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ─────────────────── THE DIFFERENTIATOR ───────────────────── */}
      <Differentiator />

      {/* ─────────────────────── RECIPE COLLECTION ────────────────── */}
      <section id="board" className="scroll-mt-20 px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-[84rem]">
          <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
            <div>
              <MonoLabel marker={false} decode className="mb-4">FEATURED RECIPES</MonoLabel>
              <SeasonHeadline
                as="h2"
                className="text-h2 text-ink"
                lines={[{ text: "A taste of what's inside" }]}
              />
            </div>
            <MonoLabel marker={false} className="text-signal">
              [ {board.length} recipes ]
            </MonoLabel>
          </div>
          <WorkWall projects={board} />
        </div>
      </section>

      {/* ────────────────────────── FEATURES ──────────────────────── */}
      <section
        id="features"
        className="scroll-mt-20 border-t border-line px-6 py-24 sm:px-10"
      >
        <div className="mx-auto max-w-[84rem]">
          <MonoLabel marker={false} decode className="mb-14">WHAT MAKES IT WORK</MonoLabel>
          <RevealGroup className="grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <RevealItem key={f.k} variant="scan" className="bg-void">
                <article className="flex h-full flex-col gap-4 p-7 transition-premium hover:bg-well">
                  <MonoLabel marker={false} className="text-signal">
                    {f.k}
                  </MonoLabel>
                  <h3
                    className="font-display text-2xl text-ink"
                    style={{ fontVariationSettings: '"wght" 600' }}
                  >
                    {f.t}
                  </h3>
                  <p className="text-body leading-relaxed text-muted">{f.b}</p>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ──────────────────────────── FAQ ─────────────────────────── */}
      <Faq />

      {/* ───────────────────── APP SCREENS (real) ─────────────────── */}
      <PhoneShowcase />

      {/* ─────────────────── WHAT PEOPLE SAY (when real) ──────────── */}
      <Testimonials />

      {/* ─────────────────────────── CTA ──────────────────────────── */}
      <section
        id="get"
        className="scroll-mt-20 overflow-hidden px-6 py-28 sm:px-10"
      >
        <div className="mx-auto max-w-[84rem]">
          <MonoLabel marker={false} decode className="mb-8">PULL UP A CHAIR</MonoLabel>
          <SeasonHeadline
            as="h2"
            className="text-display uppercase text-ink"
            lines={[
              { text: "Dinner's" },
              { text: "figured out.", accent: true },
            ]}
          />
          <p className="mt-8 max-w-xl text-body leading-relaxed text-muted">
            Feelspoon is live on Google Play and at feelspoon.app — save
            recipes, cook hands-free, and plan the week. Leave your email if
            you want product updates; no spam, just the messages that matter.
          </p>
          <div className="mt-12">
            <WaitlistForm />
          </div>
          {/* Said inline, where the hesitation happens. */}
          <p className="mt-5 max-w-xl text-body leading-relaxed text-muted">
            We don&apos;t sell your data.{" "}
            <Link
              href="/privacy"
              className="text-signal underline underline-offset-4 transition-premium hover:text-ink"
            >
              Here&apos;s what we store
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ─────────────────────── WHO BUILT IT ─────────────────────── */}
      <FounderNote />

      {/* ─────────────────────────── FOOTER ───────────────────────── */}
      <footer className="border-t border-line px-6 py-10 sm:px-10">
        <div className="mx-auto flex max-w-[84rem] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <MonoLabel marker={false}>
            © 2026 FEELSPOON — a{" "}
            <span className="whitespace-nowrap">Shift-9 product</span>
          </MonoLabel>

          {/* Internal links — the site had none, so nothing led anywhere a
              crawler could follow. */}
          <nav aria-label="Footer">
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <li>
                <a
                  href={WEB_APP_URL}
                  className="font-mono text-mono uppercase tracking-[0.18em] text-muted transition-premium hover:text-ink"
                >
                  Open in browser
                </a>
              </li>
              {[
                { href: "/pricing", label: "Pricing" },
                { href: "/privacy", label: "Privacy" },
                { href: "/vs/paprika", label: "vs Paprika" },
                { href: "/vs/samsung-food", label: "vs Samsung Food" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="font-mono text-mono uppercase tracking-[0.18em] text-muted transition-premium hover:text-ink"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </footer>
    </main>
    </>
  );
}
