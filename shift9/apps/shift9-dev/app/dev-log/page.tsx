import type { Metadata } from "next";
import { EnterTheStudio } from "../_components/EnterTheStudio";

const title = "My building journey — Shift-9 Dev Log";
const description = "Explore Kariim’s dev log: the projects, experiments, fixes, and lessons behind Shift-9.";
const image = "/dev-log-journey.png";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/dev-log" },
  openGraph: {
    title,
    description,
    type: "website",
    url: "https://www.shift9.dev/dev-log",
    images: [{ url: image, alt: "My building journey. Explore the dev log at Shift9.dev." }],
  },
  twitter: { card: "summary_large_image", title, description, images: [image] },
};

export default function DevLogPage() {
  return <EnterTheStudio initialDevLog />;
}
