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
    "/privacy.html",
    "/data-deletion.html",
  ];

  return routes.map((path) => ({
    url: `${SITE}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/studio" ? "weekly" : "monthly",
    priority:
      path === ""
        ? 1
        : path === "/studio"
          ? 0.9
          : path.endsWith(".html")
            ? 0.3
            : 0.7,
  })) as MetadataRoute.Sitemap;
}
