import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/* /sitemap.xml returned 404, so nothing told a crawler these pages exist.
   Next generates the XML from this list; add a route here when you add a
   page. */

const PAGES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.8, changeFrequency: "monthly" },
  { path: "/vs/paprika", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/samsung-food", priority: 0.7, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PAGES.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
