// ============================================
// AI.DY — Toggle like on a user post
// POST /api/user/posts/[id]/like
// Returns: { liked: boolean, likes_count: number }
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
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

  // Check the post exists and is published
  const { data: post, error: postErr } = await supabase
    .from("user_posts")
    .select("id, status")
    .eq("id", postId)
    .maybeSingle();

  if (postErr || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  if (post.status !== "published") {
    return NextResponse.json({ error: "Post is not published" }, { status: 403 });
  }

  // Check existing like
  const { data: existing } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // Unlike: delete
    const { error: delErr } = await supabase
      .from("post_likes")
      .delete()
      .eq("id", existing.id);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }
  } else {
    // Like: insert
    const { error: insErr } = await supabase
      .from("post_likes")
      .insert({ post_id: postId, user_id: user.id });
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
  }

  // Read back the (now-recalculated) likes_count from the post
  const { data: updated } = await supabase
    .from("user_posts")
    .select("likes_count")
    .eq("id", postId)
    .single();

  return NextResponse.json({
    liked: !existing,
    likes_count: updated?.likes_count ?? 0,
  });
}
