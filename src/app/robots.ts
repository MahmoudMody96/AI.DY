import type { MetadataRoute } from "next";
import { getPublicEnvSafe } from "@/lib/env";

/**
 * robots.txt for AI.DY.
 * - Allow public marketing + content
 * - Disallow auth flows, API, and any future admin paths
 * - Point to the sitemap
 */
export default function robots(): MetadataRoute.Robots {
  const env = getPublicEnvSafe();
  const baseUrl = env?.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/tools", "/tools/*", "/categories", "/categories/*", "/blog"],
        disallow: [
          "/api/",
          "/auth/",
          "/login",
          "/signup",
          "/forgot-password",
          "/admin/",
          "/dashboard/",
          "/*?*sort=",        // faceted sort URLs (avoid duplicate content)
          "/*?*page=*",       // paginated list (let Google pick canonical)
          "/*?*utm_*",        // marketing tags
        ],
      },
      {
        // Block common AI training crawlers — opt out of training data scraping.
        // (Adjust per project policy.)
        userAgent: ["GPTBot", "ClaudeBot", "CCBot", "Google-Extended"],
        disallow: ["/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
