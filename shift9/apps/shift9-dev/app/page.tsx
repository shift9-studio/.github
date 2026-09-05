import type { Metadata } from "next";
import { EnterTheStudio } from "./_components/EnterTheStudio";

/* The front door: a cinematic intro that wakes into an interactive desktop.
   The INSTRUMENT work-wall site now lives at /studio, reachable from the
   desktop's door-tile. See app/_components/EnterTheStudio.tsx (HANDOFF §18). */
export const metadata: Metadata = {
  title: "Shift-9 — Enter the Studio",
  description:
    "Enter the Shift-9 studio. A design + engineering studio building brands, products, and the systems that run them.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Shift-9 — Enter the Studio",
    description:
      "A design + engineering studio building brands, products, and the systems that run them.",
    type: "website",
    url: "https://www.shift9.dev",
    images: ["/poster.jpg"],
  },
};

export default function Home() {
  return <EnterTheStudio />;
}