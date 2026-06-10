-- ============================================
-- AI.DY — blog_posts (editorial / agent-generated content)
-- Phase 1.5 — Content Engine + Admin Posts dashboard
-- ============================================
--
-- Idempotent: safe to re-run. If the table + policies already exist, the
-- migration no-ops for the heavy DDL but still:
--   - Re-asserts the admin RLS policy
--   - Re-creates the updated_at + set_published_at triggers
--   - Re-creates the GIN index on target_tools / target_categories
--
-- Schema (ROADMAP.md lines 567-585):
--   id, slug (unique), title, excerpt, body_markdown, body_html,
--   cover_image, type ('blog_post' | 'comparison' | 'use_case'),
--   target_tools[], target_categories[], seo_keywords[],
--   reading_time_minutes, author_id, status ('draft' | 'scheduled' | 'published'),
--   published_at, created_at, updated_at
-- ============================================

-- Conditional table creation
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='blog_posts') THEN
    CREATE TABLE public.blog_posts (
      id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug                 TEXT NOT NULL UNIQUE,
      title                TEXT NOT NULL,
      excerpt              TEXT,
      body_markdown        TEXT NOT NULL,
      body_html            TEXT,
      cover_image          TEXT,
      type                 TEXT NOT NULL DEFAULT 'blog_post'
                             CHECK (type IN ('blog_post', 'comparison', 'use_case')),
      target_tools         TEXT[] NOT NULL DEFAULT '{}',
      target_categories    TEXT[] NOT NULL DEFAULT '{}',
      seo_keywords         TEXT[] NOT NULL DEFAULT '{}',
      reading_time_minutes INT,
      author_id            UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
      status               TEXT NOT NULL DEFAULT 'draft'
                             CHECK (status IN ('draft', 'scheduled', 'published')),
      published_at         TIMESTAMPTZ,
      created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
    CREATE INDEX idx_blog_posts_status_published
      ON public.blog_posts(status, published_at DESC) WHERE status = 'published';
    CREATE INDEX idx_blog_posts_type ON public.blog_posts(type);
    CREATE INDEX idx_blog_posts_type_published
      ON public.blog_posts(type, published_at DESC) WHERE status = 'published';
    CREATE INDEX idx_blog_posts_author_id ON public.blog_posts(author_id);
    CREATE INDEX idx_blog_posts_target_tools_gin
      ON public.blog_posts USING GIN (target_tools);
    CREATE INDEX idx_blog_posts_target_categories_gin
      ON public.blog_posts USING GIN (target_categories);
    CREATE INDEX idx_blog_posts_seo_keywords_gin
      ON public.blog_posts USING GIN (seo_keywords);
    CREATE INDEX idx_blog_posts_title_trgm
      ON public.blog_posts USING GIN (title gin_trgm_ops);

    ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================
-- Triggers (idempotent re-assertion)
-- ============================================
DROP TRIGGER IF EXISTS trg_blog_posts_updated_at ON public.blog_posts;
DROP TRIGGER IF EXISTS trg_blog_posts_published_at ON public.blog_posts;

CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_blog_posts_published_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_published_at();

-- ============================================
-- Row Level Security (idempotent)
-- ============================================
-- Public can read published posts
DROP POLICY IF EXISTS "blog_posts_public_read" ON public.blog_posts;
CREATE POLICY "blog_posts_public_read" ON public.blog_posts FOR SELECT
  USING (status = 'published');

-- Admins have full access (defense-in-depth; the admin/layout.tsx also
-- checks role, and Server Actions use getAdminUser() too).
DROP POLICY IF EXISTS "blog_posts_admin_all" ON public.blog_posts;
CREATE POLICY "blog_posts_admin_all" ON public.blog_posts FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
