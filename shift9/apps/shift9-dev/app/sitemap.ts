import type { MetadataRoute } from "next";

const SITE = "https://www.shift9.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    "",
    "/studio",
    "/services",
    "/start",
    "/flow-state",
    "/instrument",
    "/instrument/reference",
    "/soon",
  ];

  return routes.map((path) => ({
    url: `${SITE}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/studio" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/studio" ? 0.9 : 0.7,
  })) as MetadataRoute.Sitemap;
}
