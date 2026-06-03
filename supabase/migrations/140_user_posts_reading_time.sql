-- ============================================
-- AI.DY — Add reading_time to user_posts
-- ============================================
-- Migration 110 created user_posts without reading_time, but every
-- code path that reads or writes user_posts (blog list, blog detail,
-- /api/user/posts, /api/admin/content) populates and selects
-- reading_time. Add the column with a default of 1 minute so existing
-- rows are valid, and let the app overwrite on next write.

ALTER TABLE public.user_posts
  ADD COLUMN IF NOT EXISTS reading_time INT NOT NULL DEFAULT 1;

-- Backfill reading_time for existing posts (rough estimate: 200 wpm).
UPDATE public.user_posts
SET reading_time = GREATEST(
  1,
  ROUND(array_length(regexp_split_to_array(coalesce(body, ''), '\s+'), 1) / 200.0)::int
)
WHERE reading_time = 1 AND length(coalesce(body, '')) > 0;
