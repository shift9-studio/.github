import type { Metadata } from "next";
import { Anybody, Martian_Mono } from "next/font/google";
import "./globals.css";

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
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
