-- ============================================
-- AI.DY — Use Cases table
-- ============================================
-- Marketing/SEO landing pages that group 5-8 tools around a real
-- user scenario (e.g. "البرمجة بالذكاء الاصطناعي"). Each use case
-- has a slug, title, description, and an array of related tool IDs
-- resolved against the public.tools table at render time.
--
-- Idempotent: uses IF NOT EXISTS / DO blocks where possible so this
-- migration can be re-applied without breaking.

CREATE TABLE IF NOT EXISTS public.use_cases (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT         UNIQUE NOT NULL,
  title           TEXT         NOT NULL,
  description     TEXT         NOT NULL,
  icon            TEXT,
  cover_image     TEXT,
  related_tool_ids UUID[]      NOT NULL DEFAULT '{}'::uuid[],
  seo_keywords    TEXT[]       NOT NULL DEFAULT '{}'::text[],
  status          TEXT         NOT NULL DEFAULT 'published'
                              CHECK (status IN ('draft', 'published')),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS use_cases_slug_idx ON public.use_cases (slug);

-- Auto-touch updated_at on UPDATE
CREATE OR REPLACE FUNCTION public.touch_use_cases_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_use_cases_touch_updated_at ON public.use_cases;
CREATE TRIGGER trg_use_cases_touch_updated_at
  BEFORE UPDATE ON public.use_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_use_cases_updated_at();

-- ===========================
-- Row Level Security
-- ===========================
ALTER TABLE public.use_cases ENABLE ROW LEVEL SECURITY;

-- Public can read published use cases
DROP POLICY IF EXISTS "use_cases_read_published" ON public.use_cases;
CREATE POLICY "use_cases_read_published" ON public.use_cases
  FOR SELECT
  USING (status = 'published');

-- Admins can do anything (read draft, write, update, delete)
DROP POLICY IF EXISTS "use_cases_admin_write" ON public.use_cases;
CREATE POLICY "use_cases_admin_write" ON public.use_cases
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
