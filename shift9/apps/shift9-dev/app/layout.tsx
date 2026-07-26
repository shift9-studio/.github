import type { Metadata } from "next";
import { display, mono, text } from "./fonts";
import "./globals.css";
import { SmoothScroll } from "./_components/SmoothScroll";

/* ────────────────────────────────────────────────────────────────────────
   THREE ROLES, THREE FACES. The stack itself lives in ./fonts so the studio's
   per-project map can reuse the same instances instead of loading the same
   families a second time.

   DISPLAY - Bricolage Grotesque, variable on optical size and width, which is
   what the Proximity Weight interaction in BLUEPRINT §1.2 animates against.
   TEXT - Instrument Sans. This role did not exist: running prose was falling
   through to the monospace, and a dark studio site typeset entirely in mono is
   the most templated look on the web.
   DATA - Martian Mono, doing only its job: labels, status, the // asides.
   ──────────────────────────────────────────────────────────────────────── */

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
