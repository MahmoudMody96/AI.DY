-- ============================================
-- AI.DY — Phase 4.0: Sponsored slots
-- ============================================
-- A sponsored slot pins a specific tool to a fixed layout position
-- (e.g. the homepage hero, the /tools sidebar, or the top of a
-- /categories/[slug] page) for a defined date range. Each slot has
-- a status (active|paused|expired) so admins can disable a campaign
-- without deleting the row.
--
-- Schema follows the "spec is policy" pattern: position is a
-- free-text string (validated by a CHECK), not an enum, so we can
-- add new positions later without a migration.
--
-- 3 supported positions (Phase 4.0):
--   - homepage_hero          — banner under the hero on /
--   - tools_sidebar          — sticky card on /tools list
--   - category_top           — banner at the top of /categories/[slug]
--
-- Idempotent: re-runs are no-ops.

-- ===========================
-- Table
-- ===========================
CREATE TABLE IF NOT EXISTS public.sponsored_slots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position        TEXT NOT NULL,
  tool_id         UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at         TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active',
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT sponsored_slots_position_check
    CHECK (position IN ('homepage_hero', 'tools_sidebar', 'category_top')),
  CONSTRAINT sponsored_slots_status_check
    CHECK (status IN ('active', 'paused', 'expired')),
  CONSTRAINT sponsored_slots_window_check
    CHECK (ends_at > starts_at)
);

-- ===========================
-- Indexes
-- ===========================
-- Hot query path: find currently-active slots for a position.
-- Partial index on status='active' keeps it tight as the table grows.
CREATE INDEX IF NOT EXISTS idx_sponsored_slots_position_active
  ON public.sponsored_slots (position, ends_at)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_sponsored_slots_tool_id
  ON public.sponsored_slots (tool_id);

-- ===========================
-- updated_at trigger (re-uses the function defined in 080_triggers.sql)
-- ===========================
DROP TRIGGER IF EXISTS trg_sponsored_slots_updated_at ON public.sponsored_slots;
CREATE TRIGGER trg_sponsored_slots_updated_at
  BEFORE UPDATE ON public.sponsored_slots
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

-- ===========================
-- RLS
-- ===========================
ALTER TABLE public.sponsored_slots ENABLE ROW LEVEL SECURITY;

-- Public read: only currently-running active slots are visible.
-- We expose them via the API layer that already does the date filter
-- (so the API can include a friendly "running until X" hint), but
-- the policy here is permissive: anon can SELECT, the date+status
-- check happens in the API. Keeps RLS readable and predictable.
DROP POLICY IF EXISTS "sponsored_slots_public_read" ON public.sponsored_slots;
CREATE POLICY "sponsored_slots_public_read" ON public.sponsored_slots
  FOR SELECT USING (true);

-- Admin write: only super_admin / admin profiles can mutate slots.
DROP POLICY IF EXISTS "sponsored_slots_admin_all" ON public.sponsored_slots;
CREATE POLICY "sponsored_slots_admin_all" ON public.sponsored_slots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

-- ===========================
-- Comment
-- ===========================
COMMENT ON TABLE public.sponsored_slots IS
  'Pinned promotion slots (homepage_hero, tools_sidebar, category_top) that surface a specific tool for a defined date range. Rendered with a "مُموَّل" badge. Admin CRUD at /admin/sponsored.';
