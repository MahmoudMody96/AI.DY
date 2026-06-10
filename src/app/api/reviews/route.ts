// ============================================
// AI.DY — Reviews API
// GET  /api/reviews?tool_id=...&page=1&pageSize=10  → list published reviews
// POST /api/reviews                                  → create a review (auth required)
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// ---------- Zod schemas ----------

const ListQuerySchema = z.object({
  tool_id: z.string().uuid({ message: "tool_id must be a UUID" }),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10),
});

const CreateSchema = z.object({
  tool_id: z.string().uuid({ message: "tool_id must be a UUID" }),
  rating: z.coerce
    .number()
    .int("rating must be an integer")
    .min(1, "rating must be at least 1")
    .max(5, "rating must be at most 5"),
  title: z
    .string()
    .trim()
    .max(120, "title must be 120 characters or fewer")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  body: z
    .string()
    .trim()
    .min(10, "body must be at least 10 characters")
    .max(2000, "body must be 2000 characters or fewer"),
});

// ---------- GET: list published reviews for a tool ----------

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const url = new URL(req.url);
  const parsed = ListQuerySchema.safeParse({
    tool_id: url.searchParams.get("tool_id") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }
  const { tool_id, page, pageSize } = parsed.data;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Reviews (filtered to status='published' by RLS, but be explicit for clarity)
  const { data: reviews, error: reviewsErr } = await supabase
    .from("reviews")
    .select(
      `id, tool_id, user_id, rating, title, body, status, created_at, updated_at,
      user:profiles(id, display_name, avatar_url)`
    )
    .eq("tool_id", tool_id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (reviewsErr) {
    return NextResponse.json({ error: reviewsErr.message }, { status: 500 });
  }

  return NextResponse.json({
    reviews: (reviews ?? []) as unknown as Array<{
      id: string;
      tool_id: string;
      user_id: string;
      rating: number;
      title: string | null;
      body: string;
      status: string;
      created_at: string;
      updated_at: string;
      user: { id: string; display_name: string | null; avatar_url: string | null } | null;
    }>,
    page,
    pageSize,
  });
}

// ---------- POST: create a review (auth required) ----------

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
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }
  const input = parsed.data;

  // Verify the tool exists and is published (don't let users review drafts)
  const { data: tool, error: toolErr } = await supabase
    .from("tools")
    .select("id, is_published, status")
    .eq("id", input.tool_id)
    .maybeSingle();

  if (toolErr) {
    return NextResponse.json({ error: toolErr.message }, { status: 500 });
  }
  if (!tool) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }
  if (!tool.is_published || tool.status !== "published") {
    return NextResponse.json(
      { error: "Tool is not published" },
      { status: 403 }
    );
  }

  // Insert — RLS enforces auth.uid() = user_id; the unique(tool_id, user_id)
  // constraint enforces one review per (tool, user). ON CONFLICT we surface
  // a 409.
  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      tool_id: input.tool_id,
      user_id: user.id,
      rating: input.rating,
      title: input.title ?? null,
      body: input.body,
      status: "published",
    })
    .select(
      `id, tool_id, user_id, rating, title, body, status, created_at, updated_at,
      user:profiles(id, display_name, avatar_url)`
    )
    .single();

  if (error) {
    // 23505 = unique_violation on (tool_id, user_id)
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You have already reviewed this tool" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review }, { status: 201 });
}
