-- ============================================
-- AI.DY — User-Generated Content domain
--   user_posts, post_comments, post_likes
-- ============================================
-- Idempotent: drop in reverse-dependency order before re-creating.

DROP TABLE IF EXISTS public.post_likes CASCADE;
DROP TABLE IF EXISTS public.post_comments CASCADE;
DROP TABLE IF EXISTS public.user_posts CASCADE;

-- ===========================
-- post_status (separate from article_status
--   because editorial news has different lifecycle)
-- ===========================
DO $$ BEGIN
  CREATE TYPE post_status AS ENUM (
    'draft',        -- author is still writing
    'published',    -- visible to everyone
    'flagged',      -- auto-flagged for moderation
    'archived',     -- hidden by author or admin
    'rejected'      -- admin rejected
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ===========================
-- user_posts
-- Members' blog posts. Replaces blog->articles in the public
-- /blog route. The existing `articles` table is kept and
-- rebranded as editorial news (served at /news).
-- ===========================
CREATE TABLE public.user_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  excerpt         TEXT,
  body            TEXT NOT NULL,                          -- markdown
  cover_url       TEXT,
  author_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  status          post_status NOT NULL DEFAULT 'draft',
  likes_count     INT NOT NULL DEFAULT 0,
  comments_count  INT NOT NULL DEFAULT 0,
  shares_count    INT NOT NULL DEFAULT 0,
  views_count     INT NOT NULL DEFAULT 0,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_posts_slug            ON public.user_posts(slug);
CREATE INDEX idx_user_posts_author_id       ON public.user_posts(author_id);
CREATE INDEX idx_user_posts_category_id     ON public.user_posts(category_id);
CREATE INDEX idx_user_posts_status_published ON public.user_posts(status, published_at DESC)
  WHERE status = 'published';
CREATE INDEX idx_user_posts_tags_gin        ON public.user_posts USING GIN (tags);
CREATE INDEX idx_user_posts_title_trgm      ON public.user_posts USING GIN (title gin_trgm_ops);
CREATE INDEX idx_user_posts_created_at      ON public.user_posts(created_at DESC);

-- ===========================
-- post_comments (reuses comment_status: pending/approved/rejected/spam)
-- ===========================
CREATE TABLE public.post_comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         UUID NOT NULL REFERENCES public.user_posts(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id       UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  content         TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 4000),
  likes_count     INT NOT NULL DEFAULT 0,
  status          comment_status NOT NULL DEFAULT 'pending',
  moderated_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderated_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_comments_post_id   ON public.post_comments(post_id);
CREATE INDEX idx_post_comments_user_id   ON public.post_comments(user_id);
CREATE INDEX idx_post_comments_parent_id ON public.post_comments(parent_id);
CREATE INDEX idx_post_comments_status    ON public.post_comments(status);
CREATE INDEX idx_post_comments_created_at ON public.post_comments(created_at DESC);

-- ===========================
-- post_likes (one row per user per post; UNIQUE enforces)
-- ===========================
CREATE TABLE public.post_likes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         UUID NOT NULL REFERENCES public.user_posts(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON public.post_likes(user_id);
