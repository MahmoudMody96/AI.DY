-- ============================================
-- AI.DY — Phase 1.3: Reviews & Ratings (direct-publish)
-- ============================================
-- Replaces the old reviews table (created in 020_content.sql with
-- `content` column, `review_status` enum, pros/cons/helpful_count,
-- and a pending -> approved/rejected moderation workflow).
--
-- New schema is simpler and direct-publish:
--   - `body` (text) instead of `content`
--   - `status` (text with check) values: published | hidden | flagged
--   - default `status = 'published'` (no admin queue)
--   - no pros/cons/helpful_count
--   - no moderated_by/moderated_at
--   - one review per (tool, user)
--
-- RLS:
--   - anyone can read published
--   - auth user can write own (insert/update/delete)
--
-- Tool rating_avg / rating_count are still auto-recalculated by the
-- existing public.recalc_tool_rating() trigger, but updated to filter
-- on `status = 'published'` instead of the old `status = 'approved'`.

-- ===========================
-- Drop the old structure
-- ===========================
-- Drop old policies explicitly first (DROP POLICY doesn't accept
-- IF EXISTS for the table reference, so the table must still exist).
DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
DROP POLICY IF EXISTS "reviews_user_insert" ON public.reviews;
DROP POLICY IF EXISTS "reviews_user_update" ON public.reviews;
DROP POLICY IF EXISTS "reviews_user_delete" ON public.reviews;
DROP POLICY IF EXISTS "reviews_admin_all" ON public.reviews;

-- CASCADE drops the dependent trg_reviews_updated_at and
-- trg_reviews_recalc_rating triggers; the underlying functions
-- public.touch_updated_at() and public.recalc_tool_rating() survive.
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TYPE IF EXISTS public.review_status CASCADE;

-- ===========================
-- Re-define recalc_tool_rating() to match the new status semantics
-- ===========================
-- The function body still exists from 080_triggers.sql with the old
-- `status = 'approved'` filter. We redefine it for `status = 'published'`.
CREATE OR REPLACE FUNCTION public.recalc_tool_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_tool_id UUID;
BEGIN
  target_tool_id := COALESCE(NEW.tool_id, OLD.tool_id);

  UPDATE public.tools
  SET
    rating_avg = COALESCE((
      SELECT AVG(rating)::NUMERIC(3, 2)
      FROM public.reviews
      WHERE tool_id = target_tool_id AND status = 'published'
    ), 0),
    rating_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE tool_id = target_tool_id AND status = 'published'
    )
  WHERE id = target_tool_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ===========================
-- Create the new reviews table
-- ===========================
CREATE TABLE public.reviews (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id     UUID        NOT NULL REFERENCES public.tools(id)    ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating      INT         NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title       TEXT,
  body        TEXT        NOT NULL CHECK (char_length(body) >= 10 AND char_length(body) <= 2000),
  status      TEXT        NOT NULL DEFAULT 'published'
              CHECK (status IN ('published', 'hidden', 'flagged')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tool_id, user_id)
);

CREATE INDEX reviews_tool_id_idx    ON public.reviews(tool_id);
CREATE INDEX reviews_user_id_idx    ON public.reviews(user_id);
CREATE INDEX reviews_created_at_idx ON public.reviews(created_at DESC);
CREATE INDEX reviews_status_idx     ON public.reviews(status);

-- ===========================
-- RLS — public read, owner write
-- ===========================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read published reviews
CREATE POLICY "reviews_read_published"
  ON public.reviews FOR SELECT
  USING (status = 'published');

-- Auth user can insert their own published review
CREATE POLICY "reviews_insert_own"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'published');

-- Owner can update their own review
CREATE POLICY "reviews_update_own"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Owner can delete their own review
CREATE POLICY "reviews_delete_own"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================
-- Triggers
-- ===========================
-- updated_at on row UPDATE — re-uses public.touch_updated_at()
-- created in 080_triggers.sql.
DROP TRIGGER IF EXISTS trg_reviews_updated_at ON public.reviews;
CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Recompute parent tool's rating_avg / rating_count on any change.
DROP TRIGGER IF EXISTS trg_reviews_recalc_rating ON public.reviews;
CREATE TRIGGER trg_reviews_recalc_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.recalc_tool_rating();
