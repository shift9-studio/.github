import { PRICING } from "./site";

/* The four objections the audience actually raises, answered plainly and
   without hedging. One source: the FAQ section renders it, and the FAQPage
   JSON-LD in layout.tsx is generated from the same array, so the answer a
   search engine reads is the answer on the page. */

export type FaqItem = { q: string; a: string };

export const FAQ: FaqItem[] = [
  {
    q: "Is it only on Android?",
    a:
      "The app you install is Android only. There is no iPhone build yet, so if " +
      "you want it on your home screen and you're on iOS, that isn't ready. " +
      "There is a browser version at feelspoon.app/app that runs on any phone " +
      "or laptop, signed in or not, and it is the same app.",
  },
  {
    q: "Was this built by someone who actually cooks?",
    a:
      "Kariim spent over twenty years in restaurant operations before he wrote " +
      "a line of code. Feelspoon is the first app he shipped. His name is on " +
      "the Google Play listing and his face is at the bottom of this page.",
  },
  {
    q: "How is this different from Samsung Food?",
    a:
      "Two things. Getting the recipe in: a photo of a recipe card, your " +
      "grandmother's handwriting, a screenshot, pasted text, or just a description " +
      "of the dish. And cook mode: one step at a time in big text, read aloud, " +
      "screen awake, timers built into the steps that need them. Samsung Food is " +
      "free and broad; Feelspoon is a recipe organizer that helps you cook the thing.",
  },
  {
    q: "Is it free?",
    a:
      `${PRICING.freeLabel} to download and free to use. Save unlimited recipes, ` +
      "cook, plan the week and build shopping lists without paying anything or " +
      `entering a card. Premium is $${PRICING.monthly.toFixed(2)} a month or ` +
      `$${PRICING.annual.toFixed(2)} a year and only adds one thing: AI recipe ` +
      "captures, up to 40 a day.",
  },
  {
    q: "Does it strip the blog filler?",
    a:
      "That's the point. Paste a link and Feelspoon pulls out the title, " +
      "ingredients, steps, times and photo — and leaves the ten-paragraph life " +
      "story behind. Same for a photo of a recipe card, a cookbook page, or text " +
      "you copied from a message.",
  },
];
