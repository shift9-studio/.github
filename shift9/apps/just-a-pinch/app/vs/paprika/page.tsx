import type { Metadata } from "next";
import { VsPage, type VsContent } from "../_components/VsPage";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Feelspoon vs Paprika — which recipe manager to pick in 2026",
  description:
    "Paprika is $4.99 once per platform and runs everywhere. Feelspoon is free on Android and takes the recipe in from a photo of a card, a screenshot or pasted text. An honest side-by-side.",
  alternates: { canonical: "/vs/paprika" },
  openGraph: {
    title: "Feelspoon vs Paprika",
    description:
      "One-time purchase and every platform, against free-on-Android that reads a photo of a recipe card. The honest comparison.",
    url: `${SITE_URL}/vs/paprika`,
  },
};

/* Paprika facts here come from its own homepage and from the Sep 2026
   competitor research in the site audit: "Paprika Recipe Manager for iOS, Mac,
   Android, and Windows", $4.99 one-time with "each version of Paprika is sold
   separately", monthly meal planning, grocery lists auto-sorted by aisle, and
   500K+ downloads with 20.6K ratings on Google Play. Anything not in that
   evidence is marked "Not documented" rather than guessed. */

const content: VsContent = {
  competitor: "Paprika",
  eyebrow: "FEELSPOON VS PAPRIKA",
  headline: "Paprika has been doing this for a decade, on every device.",
  headlineAccent: "We do the bit before that: getting the recipe in at all.",
  intro:
    "Paprika is the oldest name in recipe managers and it earns that: buy it once, keep it forever, run it on your phone, your Mac and your laptop. Feelspoon is newer, Android-only, and free — and it is built around the bit before that: getting the recipe in, from whatever form it turned up in.",
  rows: [
    {
      label: "Platforms",
      mine: "Android. No iPhone build yet.",
      theirs: "iOS, Mac, Android and Windows.",
    },
    {
      label: "Price",
      mine: "Free to save, cook, plan and shop. Premium $4.99/mo or $39.99/yr for AI captures, up to 40 a day.",
      theirs: "$4.99 one time, and each platform version is sold separately.",
    },
    {
      label: "Save from a link",
      mine: "Yes — title, ingredients, steps, times and photo, with the life story left behind.",
      theirs: "Yes — saves recipes from anywhere on the web.",
    },
    {
      label: "Save from a photo or handwriting",
      mine: "Yes — scan a recipe card, a cookbook page or Grandma's handwriting.",
      theirs: "Not documented on its homepage.",
      edge: true,
    },
    {
      label: "Cooking, hands-free",
      mine: "Cook mode: one step at a time in big text, read aloud, screen kept awake, timers in the steps that need them.",
      theirs: "Not documented on its homepage.",
      edge: true,
    },
    {
      label: "Scaling",
      mine: "Change the servings and every quantity follows; US cups or metric.",
      theirs: "Scaling is a long-standing Paprika feature.",
    },
    {
      label: "Meal plan and shopping list",
      mine: "Drop recipes on a day, turn the week into a list sorted into produce, dairy, pantry, bakery.",
      theirs: "Monthly meal planning and grocery lists auto-sorted by aisle.",
    },
    {
      label: "Offline",
      mine: "Recipes live on the device and sync when you sign in.",
      theirs: "Yes, with sync across the devices you bought.",
    },
    {
      label: "Track record",
      mine: "New. Launched 2026.",
      theirs: "500K+ downloads and 20.6K ratings on Google Play.",
    },
  ],
  pickThem: {
    title: "Pick Paprika if",
    points: [
      "You cook from an iPhone, an iPad, a Mac or a Windows laptop as well as an Android phone. We do not run there and will not pretend otherwise.",
      "You would rather pay once than ever think about a subscription.",
      "You want a tool with ten years of stability behind it and thousands of ratings to read first.",
    ],
  },
  pickUs: {
    title: "Pick Feelspoon if",
    points: [
      "Android is where you cook, and free-forever beats buy-once.",
      "Most of your recipes arrive as a screenshot, a TikTok link, a photo of a recipe card, or a text from your mum.",
      "You want to point a camera at a recipe card and have it come out cookable.",
      "You cook with your hands full and want the steps read to you, one at a time, with the screen staying on.",
    ],
  },
  closing:
    "Neither of these is a trick question. If you live across four platforms, Paprika is the better buy and $4.99 is not the reason to avoid it. If you cook on an Android phone from whatever you saved this week, Feelspoon costs nothing to try and is built for exactly that.",
};

export default function Page() {
  return <VsPage c={content} />;
}
