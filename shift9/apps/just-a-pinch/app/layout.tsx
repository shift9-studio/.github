import type { Metadata } from "next";
import { Fraunces, Martian_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "./_components/SmoothScroll";
import { SiteHeader } from "./_components/SiteHeader";
import { FAQ } from "@/lib/faq";
import { PLAY_URL, PRICING, SITE_URL, STUDIO_URL } from "@/lib/site";

/* Just a Pinch keeps the system's mono (Martian Mono) but swaps the display
   face for Fraunces — a variable, high-contrast antiqua with warmth and
   "wonk". Same kinetic-variable DNA as the studio's Anybody, different
   surface. next/font injects each as the CSS variable the theme consumes;
   here --font-display-src is re-pointed at Fraunces for this app only. */
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-src",
  display: "swap",
});

const mono = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-mono-src",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Feelspoon — Smart Recipe Organizer & Cooking App",
  description:
    "Feelspoon keeps every recipe you love in one place, then walks you through cooking it — scaled to your servings, however the recipe arrived: a link, a photo of a card, or pasted text.",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  openGraph: {
    title: "Feelspoon — Smart Recipe Organizer & Cooking App",
    description:
      "Every recipe in one place. Guided, step-by-step cooking, scaled to taste, saved from a link, a photo of a recipe card, or pasted text.",
    type: "website",
    url: SITE_URL,
    siteName: "Feelspoon",
  },
  /* summary_large_image, not summary — a shared link without a picture is a
     link nobody clicks. The image itself is generated at
     app/opengraph-image.tsx, so there is no asset to go missing. */
  twitter: {
    card: "summary_large_image",
    title: "Feelspoon — Smart Recipe Organizer & Cooking App",
    description:
      "Every recipe in one place. Guided, step-by-step cooking, scaled to taste, saved from a link, a photo of a recipe card, or pasted text.",
  },
};

/* Structured data. Three graphs so an assistant asked "what is Feelspoon",
   "how much is it" or "is it on iPhone" can answer from the page instead of
   guessing. Prices and answers come from lib/site.ts and lib/faq.ts — the same
   source the visible page reads, so the two can never disagree. */
function StructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Shift-9",
        url: STUDIO_URL,
        logo: `${SITE_URL}/icon.svg`,
        sameAs: [STUDIO_URL, PLAY_URL],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Feelspoon",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#app`,
        name: "Feelspoon",
        applicationCategory: "LifestyleApplication",
        applicationSubCategory: "Recipe Organizer",
        operatingSystem: "Android",
        url: SITE_URL,
        downloadUrl: PLAY_URL,
        installUrl: PLAY_URL,
        publisher: { "@id": `${SITE_URL}/#organization` },
        description:
          "A recipe organizer for Android. Save a recipe from a link, a photo of a recipe card or handwriting, pasted text, or a description, then cook it hands-free step by step, scaled to your servings.",
        featureList: [
          "Save recipes from a link, photo, screenshot or text",
          "Hands-free cook mode with read-aloud steps and timers",
          "Scale any recipe to your servings",
          "Weekly meal planning with a generated shopping list",
          "Works offline",
        ],
        offers: [
          {
            "@type": "Offer",
            name: "Free",
            price: 0,
            priceCurrency: "USD",
            description: PRICING.freeBlurb,
          },
          {
            "@type": "Offer",
            name: "Premium monthly",
            price: PRICING.monthly,
            priceCurrency: "USD",
            description: PRICING.premiumBlurb,
          },
          {
            "@type": "Offer",
            name: "Premium yearly",
            price: PRICING.annual,
            priceCurrency: "USD",
            description: PRICING.premiumBlurb,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: FAQ.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>
        <StructuredData />
        <SmoothScroll />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
