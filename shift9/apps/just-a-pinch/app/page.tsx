import {
  DitherField,
  GrainField,
  MagneticButton,
  MonoLabel,
  SpiceMote,
  WorkWall,
  type DitherPalette,
} from "@shift9/ui";
import { getFeaturedBoard } from "@shift9/data";
import { Reveal, RevealGroup, RevealItem } from "./_components/Reveal";
import { SeasonHeadline } from "./_components/SeasonHeadline";
import { ParallaxImage } from "./_components/ParallaxImage";
import { WaitlistForm } from "./_components/WaitlistForm";
import { PhoneShowcase } from "./_components/PhoneShowcase";
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

const features = [
  {
    k: "your pantry",
    t: "All in one place",
    b: "Every recipe — links, photos, screenshots, your own — in a single searchable home you'll actually keep using.",
  },
  {
    k: "no panic",
    t: "Smart swaps",
    b: "Out of buttermilk? We hand you the fix before you panic-Google it mid-recipe.",
  },
  {
    k: "for the crowd",
    t: "Scaled to taste",
    b: "One quiet dinner or a full table — quantities and timings recalculate themselves.",
  },
  {
    k: "just cook",
    t: "Cook mode",
    b: "Hands-free, step-by-step guidance that holds your place and times each stage. Just you and the stove.",
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
      <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-6 sm:px-10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          {/* Higgsfield food photo — editorial overhead dinner spread, with a
              slow scroll parallax for depth behind the warm Dither. */}
          <ParallaxImage
            src="https://d8j0ntlcm91z4.cloudfront.net/user_3F1n9RqGZCJVrB84dvcvAMuNMRC/hf_20260625_183545_924e9d14-3d06-4ec7-aa67-d4f670a6e500.png"
            className="h-full w-full object-cover"
          />
          <DitherField palette={warm} className="absolute inset-0 h-full w-full opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-void/60 via-void/40 to-void" />
        </div>

        <div className="mx-auto w-full max-w-[84rem]">
          <MonoLabel decode className="mb-8">
            FEELSPOON — IN CLOSED TESTING · ANDROID · LAUNCHING SOON
          </MonoLabel>

          <SeasonHeadline
            as="h1"
            className="text-display uppercase tracking-[-0.02em] text-ink"
            lines={[
              { text: "Every recipe." },
              { text: "Finally cooked.", accent: true },
            ]}
          />

          <p className="mt-8 max-w-xl text-body leading-relaxed text-muted">
            Feelspoon keeps every recipe you love in one place — then walks
            you through cooking it. Scaled to your servings, with smart swaps
            when you&apos;re missing something. The recipes you save are the
            ones you&apos;ll <span className="text-ink">actually</span> make.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <MagneticButton href="#get">Get early access</MagneticButton>
            <MagneticButton href="#how" variant="ghost">
              See how it works
            </MagneticButton>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-10 right-6 hidden sm:right-10 sm:block">
          <MonoLabel marker={false}>
            <span className="text-signal">↓</span>&nbsp;&nbsp;scroll —{" "}
            {board.length} recipes inside
          </MonoLabel>
        </div>
      </section>

      {/* ────────────────────────── MANIFESTO ─────────────────────── */}
      <section className="border-y border-line px-6 py-24 sm:px-10">
        <div className="mx-auto grid max-w-[84rem] gap-10 lg:grid-cols-[1fr_2fr]">
          <MonoLabel decode className="lg:pt-3">THE STORY</MonoLabel>
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
      <section id="how" className="scroll-mt-16 px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-[84rem]">
          <MonoLabel decode className="mb-14">FROM SAVED TO SERVED</MonoLabel>
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

      {/* ─────────────────────── RECIPE COLLECTION ────────────────── */}
      <section id="board" className="scroll-mt-16 px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-[84rem]">
          <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
            <div>
              <MonoLabel decode className="mb-4">FEATURED RECIPES</MonoLabel>
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
        className="scroll-mt-16 border-t border-line px-6 py-24 sm:px-10"
      >
        <div className="mx-auto max-w-[84rem]">
          <MonoLabel decode className="mb-14">WHAT MAKES IT WORK</MonoLabel>
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

      {/* ───────────────────── APP SCREENS (real) ─────────────────── */}
      <PhoneShowcase />

      {/* ─────────────────────────── CTA ──────────────────────────── */}
      <section
        id="get"
        className="scroll-mt-16 overflow-hidden px-6 py-28 sm:px-10"
      >
        <div className="mx-auto max-w-[84rem]">
          <MonoLabel decode className="mb-8">PULL UP A CHAIR</MonoLabel>
          <SeasonHeadline
            as="h2"
            className="text-display uppercase text-ink"
            lines={[
              { text: "Dinner's" },
              { text: "figured out.", accent: true },
            ]}
          />
          <p className="mt-8 max-w-xl text-body leading-relaxed text-muted">
            Feelspoon is in closed testing on Android right now — a small
            group of cooks using it every day while we polish the last details.
            Leave your email and we&apos;ll tell you the moment it&apos;s open to
            everyone. No spam, just the one message that matters.
          </p>
          <div className="mt-12">
            <WaitlistForm />
          </div>
          <div className="mt-8">
            <MagneticButton href="https://shift9.dev" variant="ghost">
              By Shift-9 ↗
            </MagneticButton>
          </div>
        </div>
      </section>

      {/* ─────────────────────────── FOOTER ───────────────────────── */}
      <footer className="border-t border-line px-6 py-10 sm:px-10">
        <div className="mx-auto flex max-w-[84rem] flex-wrap items-center justify-between gap-4">
          <MonoLabel marker={false}>
            © 2026 FEELSPOON — a Shift-9 product
          </MonoLabel>
          <MonoLabel>build: closed testing · Android</MonoLabel>
        </div>
      </footer>
    </main>
    </>
  );
}
