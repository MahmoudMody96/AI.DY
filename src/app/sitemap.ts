import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

/**
 * Resolve the canonical site URL with sensible fallbacks.
 * Priority: NEXT_PUBLIC_SITE_URL (set in prod env) → VERCEL_URL (Vercel
 * auto-deploys) → VERCEL_PROJECT_PRODUCTION_URL → localhost.
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
 * Dynamic sitemap for AI.DY.
 * Includes static routes + every published tool + every active category.
 * Future: blog posts will be added when the admin content engine lands.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1.0, alternates: { languages: { ar: `${baseUrl}/`, "x-default": `${baseUrl}/` } } },
    { url: `${baseUrl}/tools`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/categories`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/forgot-password`, lastModified: now, changeFrequency: "yearly", priority: 0.1 },
  ];

  let dynamicEntries: MetadataRoute.Sitemap = [];

  try {
    const supabase = await createClient();
    if (supabase) {
      const [{ data: tools }, { data: categories }] = await Promise.all([
        supabase
          .from("tools")
          .select("slug, updated_at")
          .eq("is_published", true)
          .eq("status", "published"),
        supabase
          .from("categories")
          .select("slug, updated_at")
          .eq("is_active", true),
      ]);

      dynamicEntries = [
        ...(tools ?? []).map((t) => ({
          url: `${baseUrl}/tools/${t.slug}`,
          lastModified: t.updated_at ? new Date(t.updated_at) : now,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        })),
        ...(categories ?? []).map((c) => ({
          url: `${baseUrl}/categories/${c.slug}`,
          lastModified: c.updated_at ? new Date(c.updated_at) : now,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })),
      ];
    }
  } catch {
    // Best-effort: if Supabase is unreachable, return the static entries only.
    // We don't want a sitemap fetch to ever break the build.
  }

  return [...staticEntries, ...dynamicEntries];
}
