-- ============================================
-- AI.DY — Ops: api_keys, audit_log, jobs, newsletter, demos, settings
-- ============================================

DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.redirects CASCADE;
DROP TABLE IF EXISTS public.demos CASCADE;
DROP TABLE IF EXISTS public.newsletter CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP TABLE IF EXISTS public.api_keys CASCADE;

-- ===========================
-- api_keys (for future public API)
-- ===========================
CREATE TABLE public.api_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  key_hash        TEXT NOT NULL UNIQUE,             -- hashed token
  key_prefix      TEXT NOT NULL,                    -- first 8 chars for display
  scopes          TEXT[] NOT NULL DEFAULT '{}',
  last_used_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash);

-- ===========================
-- audit_log (admin actions)
-- ===========================
CREATE TABLE public.audit_log (
  id              BIGSERIAL PRIMARY KEY,
  actor_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,                    -- 'create', 'update', 'delete', 'publish', etc.
  entity_type     TEXT NOT NULL,                    -- 'tool', 'article', 'user', etc.
  entity_id       TEXT,                             -- UUID or other ID
  changes         JSONB,                            -- before/after diff
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_actor_id ON public.audit_log(actor_id);
CREATE INDEX idx_audit_log_entity_type_entity_id ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- ===========================
-- jobs (pg-boss style background jobs)
-- ===========================
CREATE TABLE public.jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue           TEXT NOT NULL,
  name            TEXT NOT NULL,
  data            JSONB NOT NULL DEFAULT '{}'::jsonb,
  status          job_status NOT NULL DEFAULT 'created',
  attempts        INT NOT NULL DEFAULT 0,
  max_attempts    INT NOT NULL DEFAULT 3,
  scheduled_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  failed_at       TIMESTAMPTZ,
  error           TEXT,
  output          JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_queue_status ON public.jobs(queue, status);
CREATE INDEX idx_jobs_scheduled_at ON public.jobs(scheduled_at) WHERE status = 'created';
CREATE INDEX idx_jobs_status ON public.jobs(status);

-- ===========================
-- newsletter (subscribers)
-- ===========================
CREATE TABLE public.newsletter (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  name            TEXT,
  is_confirmed    BOOLEAN NOT NULL DEFAULT FALSE,
  confirm_token   TEXT,
  unsubscribed_at TIMESTAMPTZ,
  locale          TEXT NOT NULL DEFAULT 'ar',
  source          TEXT,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_newsletter_email ON public.newsletter(email);
CREATE INDEX idx_newsletter_is_confirmed ON public.newsletter(is_confirmed);

-- ===========================
-- demos (per-tool interactive demo config)
-- ===========================
CREATE TABLE public.demos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id         UUID NOT NULL UNIQUE REFERENCES public.tools(id) ON DELETE CASCADE,
  type            demo_type NOT NULL DEFAULT 'iframe',
  embed_url       TEXT,                             -- iframe src
  redirect_url    TEXT,                             -- where to redirect
  video_url       TEXT,                             -- demo video
  screenshot_url  TEXT,                             -- static preview
  settings        JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_demos_tool_id ON public.demos(tool_id);
CREATE INDEX idx_demos_is_active ON public.demos(is_active);

-- ===========================
-- redirects (URL redirect map)
-- ===========================
CREATE TABLE public.redirects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path       TEXT NOT NULL UNIQUE,
  to_path         TEXT NOT NULL,
  status_code     INT NOT NULL DEFAULT 301,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_redirects_from_path ON public.redirects(from_path);

-- ===========================
-- site_settings (key-value config)
-- ===========================
CREATE TABLE public.site_settings (
  key             TEXT PRIMARY KEY,
  value           JSONB NOT NULL,
  description     TEXT,
  is_public       BOOLEAN NOT NULL DEFAULT FALSE,  -- can be read by anon
  updated_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_site_settings_is_public ON public.site_settings(is_public);
