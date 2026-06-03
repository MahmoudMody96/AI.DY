-- ============================================
-- AI.DY — Triggers for user_posts / post_comments / post_likes
-- ============================================
-- Idempotent: drops trigger functions first.

DROP FUNCTION IF EXISTS public.touch_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.recalc_post_likes()    CASCADE;
DROP FUNCTION IF EXISTS public.recalc_post_comments() CASCADE;
DROP FUNCTION IF EXISTS public.set_post_published_at() CASCADE;

-- ===========================
-- Generic touch_updated_at (same as 080, recreated here so this
-- migration is self-contained even if 080 hasn't run yet)
-- ===========================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_user_posts_updated_at BEFORE UPDATE ON public.user_posts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_post_comments_updated_at BEFORE UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===========================
-- Auto-set published_at when post goes from non-published → published
-- ===========================
CREATE OR REPLACE FUNCTION public.set_post_published_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'published'
     AND OLD.status <> 'published'
     AND NEW.published_at IS NULL THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_user_posts_published_at BEFORE UPDATE ON public.user_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_post_published_at();

-- ===========================
-- Recalc user_posts.likes_count when post_likes change
-- ===========================
CREATE OR REPLACE FUNCTION public.recalc_post_likes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_post_id UUID;
BEGIN
  target_post_id := COALESCE(NEW.post_id, OLD.post_id);

  UPDATE public.user_posts
  SET likes_count = (
    SELECT COUNT(*) FROM public.post_likes WHERE post_id = target_post_id
  )
  WHERE id = target_post_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_post_likes_recalc
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.recalc_post_likes();

-- ===========================
-- Recalc user_posts.comments_count when post_comments change.
-- Counts only approved comments (pending ones still increment
-- but get decremented when rejected, so the public view stays
-- accurate). For simplicity, we count all non-rejected comments.
-- ===========================
CREATE OR REPLACE FUNCTION public.recalc_post_comments()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_post_id UUID;
BEGIN
  target_post_id := COALESCE(NEW.post_id, OLD.post_id);

  UPDATE public.user_posts
  SET comments_count = (
    SELECT COUNT(*) FROM public.post_comments
    WHERE post_id = target_post_id AND status = 'approved'
  )
  WHERE id = target_post_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_post_comments_recalc
  AFTER INSERT OR UPDATE OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.recalc_post_comments();
