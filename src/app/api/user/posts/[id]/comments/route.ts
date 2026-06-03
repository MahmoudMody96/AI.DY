// ============================================
// AI.DY — Add a comment to a user post
// POST /api/user/posts/[id]/comments
// Returns: { comment: Comment }
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const CommentSchema = z.object({
  content: z.string().min(1).max(4000),
  parent_id: z.string().uuid().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

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

  const parsed = CommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  // Verify post exists and is published
  const { data: post, error: postErr } = await supabase
    .from("user_posts")
    .select("id, status")
    .eq("id", postId)
    .maybeSingle();

  if (postErr || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  if (post.status !== "published") {
    return NextResponse.json(
      { error: "Cannot comment on unpublished post" },
      { status: 403 }
    );
  }

  // RLS policy on post_comments.user_insert already requires:
  //   - auth.uid() = user_id
  //   - post status = published
  // We trust the RLS layer. Insert with status='pending' so the comment
  // is held for moderation (the trigger will increment comments_count
  // only after the admin sets status=approved).
  const { data: comment, error } = await supabase
    .from("post_comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      content: parsed.data.content,
      parent_id: parsed.data.parent_id ?? null,
      status: "pending",
    })
    .select("id, content, status, created_at, parent_id, post_id, user_id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Hydrate with author info
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json(
    {
      comment: {
        id: comment.id,
        content: comment.content,
        author: profile
          ? { display_name: profile.display_name, avatar_url: profile.avatar_url }
          : null,
        created_at: comment.created_at,
        parent_id: comment.parent_id,
        status: comment.status,
      },
    },
    { status: 201 }
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("post_comments")
    .select("id, content, status, created_at, parent_id, user_id")
    .eq("post_id", postId)
    .eq("status", "approved")
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Hydrate with author info
  const userIds = Array.from(new Set((data ?? []).map((c) => c.user_id)));
  const userMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds);
    ((profiles as { id: string; display_name: string | null; avatar_url: string | null }[] | null) ?? []).forEach(
      (p) => {
        userMap[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url };
      }
    );
  }

  return NextResponse.json({
    comments: (data ?? []).map((c) => ({
      id: c.id,
      content: c.content,
      status: c.status,
      created_at: c.created_at,
      parent_id: c.parent_id,
      author: userMap[c.user_id] ?? null,
    })),
  });
}
