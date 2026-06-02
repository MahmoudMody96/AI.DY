import type { MetadataRoute } from "next";

/**
 * Resolve the canonical site URL with sensible fallbacks.
 * Priority: NEXT_PUBLIC_SITE_URL → VERCEL_PROJECT_PRODUCTION_URL → VERCEL_URL → localhost.
 */
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

/**
 * robots.txt for AI.DY.
 * - Allow public marketing + content
 * - Disallow auth flows, API, and any future admin paths
 * - Point to the sitemap
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

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
