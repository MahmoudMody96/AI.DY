// ============================================
// AI.DY — Admin Content API
// POST: create news article or user post (auth: API key OR admin user)
// GET:  list recent items (auth: API key OR admin user)
//
// Auth methods (in order of preference):
//   1. X-API-Key header (uses ADMIN_API_KEY env)
//   2. Authorization: Bearer <key>
//   3. Authenticated admin user session
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ContentSchema = z.object({
  // 'news' (default) publishes to `articles`; 'user_post' to `user_posts`
  kind: z.enum(["news", "user_post"]).default("news"),

  // Shared fields
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(120).regex(/^[a-z0-9-]+$/).optional(),
  excerpt: z.string().max(500).optional(),
  body: z.string().min(10),
  cover_url: z.string().url().optional(),
  category_slug: z.string().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(["draft", "published", "archived"]).default("draft"),

  // News-only
  meta_title: z.string().max(200).optional(),
  meta_description: z.string().max(500).optional(),
  is_featured: z.boolean().default(false),

  // User post-only
  author_email: z.string().email().optional(), // resolved to profile
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

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function authenticate(req: NextRequest): Promise<
  { kind: "api_key"; key: string } | { kind: "admin_user" } | null
> {
  // 1) Check API key
  const expected = process.env.ADMIN_API_KEY;
  const provided =
    req.headers.get("x-api-key") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (provided && expected && constantTimeEq(provided, expected)) {
    return { kind: "api_key", key: provided };
  }
  if (provided && !expected) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[api/admin/content] ADMIN_API_KEY not set — endpoint is open in dev");
      return { kind: "api_key", key: provided };
    }
    return null;
  }

  // 2) Check admin user session
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile && (profile.role === "admin" || profile.role === "super_admin")) {
    return { kind: "admin_user" };
  }

  return null;
}

export async function POST(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) {
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

  const parsed = ContentSchema.safeParse(body);
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

  // Auto-slug + ensure unique
  const baseSlug = input.slug ?? slugify(input.title);
  const table = input.kind === "news" ? "articles" : "user_posts";
  let finalSlug = baseSlug;
  let suffix = 1;
  while (true) {
    const { data } = await admin
      .from(table)
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

  let result;
  if (input.kind === "news") {
    const publishedAt =
      input.status === "published" ? new Date().toISOString() : null;
    const { data, error } = await admin
      .from("articles")
      .insert({
        slug: finalSlug,
        title: input.title,
        excerpt: input.excerpt ?? null,
        content_mdx: input.body,
        cover_url: input.cover_url ?? null,
        category_id: categoryId,
        tags: input.tags,
        reading_time: readingTime(input.body),
        status: input.status,
        is_featured: input.is_featured,
        published_at: publishedAt,
        meta_title: input.meta_title ?? null,
        meta_description: input.meta_description ?? null,
      })
      .select("id, slug, status, published_at")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = { item: data, table: "articles" };
  } else {
    // user_post — resolve author
    let authorId: string | null = null;
    if (input.author_email) {
      const { data } = await admin
        .from("profiles")
        .select("id")
        .eq("email", input.author_email)
        .maybeSingle();
      authorId = data?.id ?? null;
    }
    if (!authorId) {
      return NextResponse.json(
        {
          error:
            "user_post requires author_email (or implement session-based author resolution)",
        },
        { status: 400 }
      );
    }
    const { data, error } = await admin
      .from("user_posts")
      .insert({
        slug: finalSlug,
        title: input.title,
        excerpt: input.excerpt ?? null,
        body: input.body,
        cover_url: input.cover_url ?? null,
        author_id: authorId,
        category_id: categoryId,
        tags: input.tags,
        reading_time: readingTime(input.body),
        status: input.status,
      })
      .select("id, slug, status, published_at")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = { item: data, table: "user_posts" };
  }

  return NextResponse.json(
    {
      ok: true,
      ...result,
      links: {
        public:
          input.kind === "news" ? `/news/${result.item.slug}` : `/blog/${result.item.slug}`,
        admin:
          input.kind === "news"
            ? `/admin/news/${result.item.id}/edit`
            : `/admin/user-posts`,
      },
    },
    { status: 201 }
  );
}

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const url = new URL(req.url);
  const kind = (url.searchParams.get("kind") ?? "all") as "news" | "user_post" | "all";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);

  const out: Record<string, unknown[]> = { articles: [], user_posts: [] };

  if (kind === "news" || kind === "all") {
    const { data } = await admin
      .from("articles")
      .select("id, slug, title, status, published_at, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    out.articles = data ?? [];
  }
  if (kind === "user_post" || kind === "all") {
    const { data } = await admin
      .from("user_posts")
      .select("id, slug, title, status, author_id, published_at, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    out.user_posts = data ?? [];
  }

  return NextResponse.json(out);
}
