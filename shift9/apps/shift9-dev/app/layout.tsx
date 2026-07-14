import type { Metadata } from "next";
import { Anybody, Martian_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { SmoothScroll } from "./_components/SmoothScroll";

/* Free variable stack (no licence needed): Anybody carries the condensed,
   width-flexing display voice; Martian Mono is the terminal data face.
   next/font injects each as a CSS variable consumed by @shift9/theme. */
const display = Anybody({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-display-src",
  display: "swap",
});

const mono = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-mono-src",
  display: "swap",
});

/* Fraunces (variable, wght 500–600, latin) — the "Enter the Studio" film-title
   lockup face on the entry front door. Self-hosted through the site font
   pipeline (was base64-inlined in the prototype); exposed as a CSS variable the
   entry component consumes, so it makes no runtime network request. */
const fraunces = localFont({
  src: "./_fonts/Fraunces-var.woff2",
  weight: "500 600",
  style: "normal",
  variable: "--font-fraunces",
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
      className={`${display.variable} ${mono.variable} ${fraunces.variable}`}
    >
      <body>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
