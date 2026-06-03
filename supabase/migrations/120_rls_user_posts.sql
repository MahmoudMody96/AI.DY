-- ============================================
-- AI.DY — RLS for user_posts, post_comments, post_likes
-- ============================================
-- Idempotent: drops existing policies first, then re-creates.
-- Assumes the helper functions public.is_admin() and
-- public.is_super_admin() already exist (created in 070_rls.sql).

-- ===========================
-- Enable RLS
-- ===========================
ALTER TABLE public.user_posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes    ENABLE ROW LEVEL SECURITY;

-- ===========================
-- user_posts
-- ===========================
DROP POLICY IF EXISTS "user_posts_public_read"   ON public.user_posts;
DROP POLICY IF EXISTS "user_posts_author_insert" ON public.user_posts;
DROP POLICY IF EXISTS "user_posts_author_update" ON public.user_posts;
DROP POLICY IF EXISTS "user_posts_author_delete" ON public.user_posts;
DROP POLICY IF EXISTS "user_posts_admin_all"     ON public.user_posts;

-- Anyone (incl. anon) can read published posts.
CREATE POLICY "user_posts_public_read" ON public.user_posts FOR SELECT
  USING (status = 'published');

-- Authors can create posts for themselves.
CREATE POLICY "user_posts_author_insert" ON public.user_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Authors can update their own (draft → published transitions etc.).
CREATE POLICY "user_posts_author_update" ON public.user_posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Authors can delete (archive) their own.
CREATE POLICY "user_posts_author_delete" ON public.user_posts FOR DELETE
  USING (auth.uid() = author_id);

-- Admins can do anything.
CREATE POLICY "user_posts_admin_all" ON public.user_posts FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ===========================
-- post_comments
-- ===========================
DROP POLICY IF EXISTS "post_comments_public_read"   ON public.post_comments;
DROP POLICY IF EXISTS "post_comments_user_insert"   ON public.post_comments;
DROP POLICY IF EXISTS "post_comments_author_update" ON public.post_comments;
DROP POLICY IF EXISTS "post_comments_author_delete" ON public.post_comments;
DROP POLICY IF EXISTS "post_comments_admin_all"     ON public.post_comments;

-- Anon sees approved comments only.
CREATE POLICY "post_comments_public_read" ON public.post_comments FOR SELECT
  USING (status = 'approved');

-- Authenticated users can add their own (post must be published;
-- enforced here as a defensive check; primary gate is app-level).
CREATE POLICY "post_comments_user_insert" ON public.post_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.user_posts p
      WHERE p.id = post_id AND p.status = 'published'
    )
  );

-- Authors can edit/delete their own comments.
CREATE POLICY "post_comments_author_update" ON public.post_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_comments_author_delete" ON public.post_comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "post_comments_admin_all" ON public.post_comments FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ===========================
-- post_likes
-- ===========================
DROP POLICY IF EXISTS "post_likes_public_read"   ON public.post_likes;
DROP POLICY IF EXISTS "post_likes_user_insert"   ON public.post_likes;
DROP POLICY IF EXISTS "post_likes_user_delete"   ON public.post_likes;
DROP POLICY IF EXISTS "post_likes_admin_all"     ON public.post_likes;

-- Authenticated users can read who liked what (so the UI can
-- highlight "you liked this"). Anon gets nothing (deny by default).
CREATE POLICY "post_likes_public_read" ON public.post_likes FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can like posts on their own behalf.
CREATE POLICY "post_likes_user_insert" ON public.post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unlike (delete) their own.
CREATE POLICY "post_likes_user_delete" ON public.post_likes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "post_likes_admin_all" ON public.post_likes FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
