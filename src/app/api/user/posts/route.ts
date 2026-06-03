// ============================================
// AI.DY — User Posts API
// POST: create a new user post (auth required)
// GET:  list published user posts (public, with optional filters)
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const CreatePostSchema = z.object({
  title: z.string().min(3).max(200),
  body: z.string().min(10).max(50_000),
  excerpt: z.string().max(500).optional(),
  cover_url: z.string().url().optional(),
  category_slug: z.string().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(["draft", "published"]).default("draft"),
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

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  // Require auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreatePostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }
  const input = parsed.data;

  // Resolve category by slug (optional)
  let categoryId: string | null = null;
  if (input.category_slug) {
    const { data } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", input.category_slug)
      .eq("is_active", true)
      .maybeSingle();
    categoryId = data?.id ?? null;
  }

  // Auto-slug + ensure unique
  const baseSlug = slugify(input.title);
  let finalSlug = baseSlug;
  let suffix = 1;
  while (true) {
    const { data } = await supabase
      .from("user_posts")
      .select("id")
      .eq("slug", finalSlug)
      .maybeSingle();
    if (!data) break;
    finalSlug = `${baseSlug}-${++suffix}`;
    if (suffix > 50) {
      return NextResponse.json(
        { error: "Could not generate unique slug" },
        { status: 409 }
      );
    }
  }

  const { data: post, error } = await supabase
    .from("user_posts")
    .insert({
      slug: finalSlug,
      title: input.title,
      excerpt: input.excerpt ?? null,
      body: input.body,
      cover_url: input.cover_url ?? null,
      author_id: user.id,
      category_id: categoryId,
      tags: input.tags,
      status: input.status,
      reading_time: readingTime(input.body),
      // published_at is set automatically by the trigger when status -> published
    })
    .select("id, slug, status, published_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      ok: true,
      post,
      links: {
        public: `/blog/${post.slug}`,
      },
    },
    { status: 201 }
  );
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 50);
  const categorySlug = url.searchParams.get("category");

  let query = supabase
    .from("user_posts")
    .select("id, slug, title, excerpt, cover_url, tags, reading_time, published_at, author_id, likes_count, comments_count")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (categorySlug) {
    // Resolve category first
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .eq("is_active", true)
      .maybeSingle();
    if (cat) {
      query = query.eq("category_id", cat.id);
    }
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts: data });
}
