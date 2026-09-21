/* One place for the facts the site states out loud.
   Every number here is copied from a live source — the Google Play listing
   (play.google.com/store/apps/details?id=com.justapinch.app) and the app's own
   RevenueCat products — so a page can never drift from what the store says.
   Change it here, not in a section. */

export const SITE_URL = "https://feelspoon.app";
export const PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.justapinch.app";
export const STUDIO_URL = "https://shift9.dev";

/* The browser version of the app. It was never deleted: the built files were
   taken out of the Feelspoon repo on purpose so CI builds them instead, and
   the GitHub Pages workflow has been publishing it on every push since, most
   recently 10 Sep 2026. The new marketing site simply never linked to it, and
   feelspoon.app/app returned 404, which is why it looked gone.

   feelspoon.app/app now REDIRECTS here rather than proxying: the Expo export
   asks for its own assets at absolute /Feelspoon/app/... paths, so a proxy
   would serve the page and then fail to load a single script. */
export const WEB_APP_URL = "https://kariimc.github.io/Feelspoon/app/";

/** The real model, as the Play listing words it. */
export const PRICING = {
  freeLabel: "Free",
  freeBlurb:
    "Save unlimited recipes, cook, plan and shop. No card, no trial clock.",
  premiumLabel: "Premium",
  premiumBlurb: "Everything in Free, plus unlimited AI recipe captures.",
  monthly: 4.99,
  annual: 39.99,
  /** $39.99 / 12 — the honest per-month figure when billed yearly. */
  annualPerMonth: 3.33,
  /** $39.99 / 52. Used for the value anchor; keep it truthful. */
  annualPerWeek: 0.77,
} as const;

/* Third-party proof is NOT kept here. It is read from the live Google Play
   listing at build time by lib/play-proof.ts, so the star rating appears the
   day Play publishes one and nobody has to type it in. */

/** Below this many downloads the figure is hidden: a tiny number read as
    proof is worse than no number. The audit uses the same threshold. */
export const PROOF_MIN_DOWNLOADS = 100;

/** The person behind it. Everything here comes from his own public LinkedIn
    profile (linkedin.com/in/kariim-chiles) and his posts on it, read
    19 Sep 2026. The photo is his LinkedIn profile picture, cropped square. */
export const FOUNDER = {
  name: "Kariim Chiles",
  role: "Founder of Shift-9 Studios",
  photo: "/people/kariim-224.jpg",
  photo2x: "/people/kariim-448.jpg",
  linkedin: "https://www.linkedin.com/in/kariim-chiles",
  /** His words, from his LinkedIn post announcing the app. */
  why: "I built Feelspoon. Now I want it in the hands of people who will actually use it in the kitchen.",
  /** Also his words, and the answer to "built by people who don't cook". */
  background:
    "I studied computer engineering earlier in life, then spent over 20 years in restaurant operations.",
} as const;

/** Named-user quotes. Empty until real ones are collected — the section does
    not render while this is empty, so no placeholder voice ever ships. */
export const TESTIMONIALS: {
  quote: string;
  name: string;
  context: string;
  photo: string | null;
}[] = [];
