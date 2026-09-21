import type { Metadata } from "next";
import { VsPage, type VsContent } from "../_components/VsPage";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Feelspoon vs Samsung Food — free recipe apps, compared honestly",
  description:
    "Samsung Food is genuinely free with no paywall on the core features. Feelspoon is free too, and takes a recipe in from a photo of a card or handwriting. Which one fits how you cook.",
  alternates: { canonical: "/vs/samsung-food" },
  openGraph: {
    title: "Feelspoon vs Samsung Food",
    description:
      "Both free. One is a broad platform tied to an ecosystem; the other is a recipe organizer built around getting your recipes in and cooking them.",
    url: `${SITE_URL}/vs/samsung-food`,
  },
};

/* Samsung Food facts come from the Sep 2026 competitor research in the site
   audit, which records it as "genuinely free, with no paywall blocking the
   core features" and carrying Samsung's brand and ecosystem behind it. That
   research did not capture its feature list, so every row we cannot point at
   says "Not documented here" instead of guessing at a competitor's product. */

const content: VsContent = {
  competitor: "Samsung Food",
  eyebrow: "FEELSPOON VS SAMSUNG FOOD",
  headline: "Samsung Food is free and it is not a trap.",
  headlineAccent: "The question is whether you want a platform or a cook's tool.",
  intro:
    "Samsung Food genuinely costs nothing and does not paywall the core of it, which makes \"just use the free one\" a fair thing to say. It is also a broad food platform with a big company and an appliance ecosystem behind it. Feelspoon is free too, and much narrower on purpose: get the recipe in from whatever form it arrived in, then cook it.",
  rows: [
    {
      label: "Price",
      mine: "Free to save, cook, plan and shop. Premium $4.99/mo or $39.99/yr for unlimited AI captures only.",
      theirs: "Free, with no paywall on the core features.",
    },
    {
      label: "Who is behind it",
      mine: "One developer at Shift-9, named on the Play listing.",
      theirs: "Samsung, with its appliance and account ecosystem alongside it.",
    },
    {
      label: "Cooking, hands-free",
      mine: "Cook mode: one step at a time in big text, read aloud, screen kept awake, timers in the steps that need them.",
      theirs: "Not documented here.",
      edge: true,
    },
    {
      label: "Save from a photo or handwriting",
      mine: "Scan a recipe card, a cookbook page or handwriting; paste text from a message; or describe a dish.",
      theirs: "Not documented here.",
      edge: true,
    },
    {
      label: "Scaling",
      mine: "Change the servings and every quantity follows; US cups or metric.",
      theirs: "Not documented here.",
    },
    {
      label: "Meal plan and shopping list",
      mine: "Drop recipes on a day, turn the week into a list sorted into produce, dairy, pantry, bakery.",
      theirs: "Meal planning and lists are part of the platform.",
    },
    {
      label: "Scope",
      mine: "A recipe organizer. Not a social network, not a shop, not an appliance remote.",
      theirs: "A broad food platform with community and ecosystem features.",
    },
    {
      label: "Offline",
      mine: "Recipes live on the device and sync when you sign in.",
      theirs: "Not documented here.",
    },
  ],
  pickThem: {
    title: "Pick Samsung Food if",
    points: [
      "You want a big, free platform with community and discovery built in, and you like having more in one app rather than less.",
      "You already live in Samsung's ecosystem and want your kitchen and your account to line up.",
      "You want the reassurance of a large company maintaining it.",
    ],
  },
  pickUs: {
    title: "Pick Feelspoon if",
    points: [
      "You want a recipe organizer and nothing else bolted onto it.",
      "You cook with your hands full and want the steps read aloud, one at a time, with the screen staying on and the timers already set.",
    ],
  },
  closing:
    "If free is the whole question, Samsung Food answers it and so do we. The difference is scope: theirs is a platform that includes recipes, ours is a recipe organizer that helps you cook the thing. Try ours; it costs nothing to find out which one you open on a Tuesday night.",
};

export default function Page() {
  return <VsPage c={content} />;
}
