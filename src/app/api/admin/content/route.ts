// ============================================
// AI.DY — Admin Content API
// Endpoint for AI agents / automation to publish content
// Auth: requires an API key passed in the X-API-Key header
//       (or Authorization: Bearer <key>)
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const ArticleSchema = z.object({
  type: z.enum(["blog_post", "comparison", "use_case"]).default("blog_post"),
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(120).regex(/^[a-z0-9-]+$/).optional(),
  excerpt: z.string().max(500).optional(),
  body: z.string().min(10),
  cover_url: z.string().url().optional(),
  category_slug: z.string().optional(),
  target_tool_slugs: z.array(z.string()).default([]),
  target_category_slugs: z.array(z.string()).default([]),
  seo_keywords: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  status: z.enum(["draft", "scheduled", "published"]).default("draft"),
  scheduled_at: z.string().datetime().optional(),
  author_email: z.string().email().optional(),
  meta_title: z.string().max(200).optional(),
  meta_description: z.string().max(500).optional(),
});

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

function readingTime(md: string): number {
  const words = md.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function authOk(req: NextRequest): boolean {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[api/admin/content] ADMIN_API_KEY not set — endpoint is open in dev");
      return true;
    }
    return false;
  }
  const provided =
    req.headers.get("x-api-key") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!provided) return false;
  if (provided.length !== expected.length) return false;
  // Constant-time comparison
  let mismatch = 0;
  for (let i = 0; i < provided.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function POST(req: NextRequest) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Service unavailable", hint: "SUPABASE_SERVICE_ROLE_KEY not set" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ArticleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }
  const input = parsed.data;

  // Resolve category
  let categoryId: string | null = null;
  if (input.category_slug) {
    const { data } = await admin
      .from("categories")
      .select("id")
      .eq("slug", input.category_slug)
      .maybeSingle();
    categoryId = data?.id ?? null;
  }

  // Resolve author
  let authorId: string | null = null;
  if (input.author_email) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("email", input.author_email)
      .maybeSingle();
    authorId = data?.id ?? null;
  }

  // Auto-slug + ensure unique
  let baseSlug = input.slug ?? slugify(input.title);
  let finalSlug = baseSlug;
  let suffix = 1;
  while (true) {
    const { data } = await admin
      .from("articles")
      .select("id")
      .eq("slug", finalSlug)
      .maybeSingle();
    if (!data) break;
    finalSlug = `${baseSlug}-${++suffix}`;
    if (suffix > 50) {
      return NextResponse.json(
        { error: "Could not generate unique slug", baseSlug },
        { status: 409 }
      );
    }
  }

  const status =
    input.status === "published" ? "published" : input.status === "scheduled" ? "draft" : "draft";
  const publishedAt =
    input.status === "published"
      ? new Date().toISOString()
      : input.scheduled_at ?? null;

  // Build tag list: union of user tags + target tools + seo keywords
  const tags = Array.from(
    new Set([...input.tags, ...input.target_tool_slugs, ...input.seo_keywords])
  );

  const { data: article, error } = await admin
    .from("articles")
    .insert({
      slug: finalSlug,
      title: input.title,
      excerpt: input.excerpt ?? null,
      content_mdx: input.body,
      cover_url: input.cover_url ?? null,
      author_id: authorId,
      category_id: categoryId,
      tags,
      reading_time: readingTime(input.body),
      status,
      published_at: publishedAt,
      meta_title: input.meta_title ?? null,
      meta_description: input.meta_description ?? null,
    })
    .select("id, slug, status, published_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      ok: true,
      article,
      links: {
        public: `/blog/${article.slug}`,
        admin: `/admin/posts/${article.id}/edit`,
      },
    },
    { status: 201 }
  );
}

export async function GET(req: NextRequest) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
  const { data, error } = await admin
    .from("articles")
    .select("id, slug, title, status, published_at, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ articles: data });
}
