import type { Metadata } from "next";
import { Fraunces, Martian_Mono } from "next/font/google";
import "./globals.css";

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
  title: "Just a Pinch — Smart Recipe Organizer & Cooking App",
  description:
    "Just a Pinch keeps every recipe you love in one place, then walks you through cooking it — scaled to your servings, with smart swaps when you're missing something.",
  metadataBase: new URL("https://shift9.dev"),
  openGraph: {
    title: "Just a Pinch — Smart Recipe Organizer & Cooking App",
    description:
      "Every recipe in one place. Guided, step-by-step cooking, scaled to taste, with smart swaps when you're missing an ingredient.",
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
