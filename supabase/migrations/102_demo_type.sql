-- ============================================
-- AI.DY — Phase 1.4: Demo framework schema
-- ============================================
-- Adds interactive demo support to the `tools` table:
--
--   demo_type   text  — the kind of widget to render on the tool page
--                       (null = no demo). Drives the DemoRenderer registry
--                       in src/components/demos/registry.ts.
--
--   demo_config jsonb — per-tool config the widget reads. Shape varies by
--                       demo_type. Common keys:
--                         { model, systemPrompt, maxTokens, rateLimit,
--                           endpoint, fields, ... }
--                       Anything not present in demo_config is filled from
--                       the demo_type's default widget configuration.
--
-- Idempotent: re-runs are no-ops.
-- No data loss: both columns are nullable / default '{}'.

-- ===========================
-- Columns
-- ===========================
ALTER TABLE public.tools
  ADD COLUMN IF NOT EXISTS demo_type  TEXT,
  ADD COLUMN IF NOT EXISTS demo_config JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ===========================
-- Constraint: demo_type whitelist
-- ===========================
-- Drop any old version of the check (it was not in 101_reviews.sql but
-- this is the right place to enforce it now).
ALTER TABLE public.tools
  DROP CONSTRAINT IF EXISTS tools_demo_type_check;

ALTER TABLE public.tools
  ADD CONSTRAINT tools_demo_type_check
  CHECK (
    demo_type IS NULL
    OR demo_type IN ('chat', 'image-gallery', 'tts', 'code-sandbox', 'template-form')
  );

-- ===========================
-- Indexes
-- ===========================
-- Most tools will have demo_type = NULL, so a partial index on
-- non-null values is small + fast for the "tools that have demos"
-- query path on the home / categories pages.
CREATE INDEX IF NOT EXISTS tools_demo_type_idx
  ON public.tools (demo_type)
  WHERE demo_type IS NOT NULL;

-- ===========================
-- Comments
-- ===========================
COMMENT ON COLUMN public.tools.demo_type IS
  'kind of interactive demo embedded on the tool page (chat, image-gallery, tts, code-sandbox, template-form)';

COMMENT ON COLUMN public.tools.demo_config IS
  'per-tool demo configuration (model, systemPrompt, maxTokens, rateLimit, endpoint, fields...) — shape varies by demo_type';
