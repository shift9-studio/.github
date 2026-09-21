import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/* /robots.txt returned 404. Everything here is indexable, and the AI crawlers
   are named explicitly rather than left to infer permission from the
   wildcard — an assistant asked "what is Feelspoon" should be allowed to go
   and read the answer. */

const AI_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "PerplexityBot",
  "Google-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/api/" },
      ...AI_AGENTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: "/api/",
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
