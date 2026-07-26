import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans, Martian_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "./_components/SmoothScroll";

/* ────────────────────────────────────────────────────────────────────────
   THREE ROLES, THREE FACES.

   The site had two faces doing three jobs, and the one carrying running prose
   was the monospace — body copy, page after page, set in Martian Mono. A dark
   studio site typeset entirely in mono is the most templated look on the web,
   and the blueprint itself only ever calls Martian Mono "the terminal data
   face". It never asked it to carry paragraphs.

   DISPLAY — Bricolage Grotesque. Variable on three axes (optical size, width,
   weight), which is what the Proximity Weight interaction in BLUEPRINT §1.2
   needs to animate against; a static face cannot do that at all. It is a
   grotesque with deliberate irregularities — the sort of face a studio picks
   and a template never does — and its optical-size axis means the headline
   and the small print are drawn for their sizes rather than scaled to them.

   TEXT — Instrument Sans. The role that did not exist. Understated, wide
   apertures, and specifically not Inter, which is the default every generated
   site reaches for.

   DATA — Martian Mono, unchanged, and now doing only its job: labels, status,
   coordinates, the // asides. Demoting it is what makes it read as
   instrumentation again instead of as the whole site's voice.

   All three are variable, all three load through next/font, so there is one
   file per family and no layout shift.
   ──────────────────────────────────────────────────────────────────────── */

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  variable: "--font-display-src",
  display: "swap",
});

const text = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-text-src",
  display: "swap",
});

const mono = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-mono-src",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shift-9 — Design + Engineering Studio",
  description:
    "Code execution in motion. Shift-9 designs and ships brands, products, and the systems that run them.",
  metadataBase: new URL("https://shift9.dev"),
  openGraph: {
    title: "Shift-9 — Design + Engineering Studio",
    description:
      "Code execution in motion. We design and ship brands, products, and the systems behind them.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${text.variable} ${mono.variable}`}
    >
      <body>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
