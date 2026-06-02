-- ============================================
-- AI.DY — Business: leads, plans, subscriptions, payments
-- ============================================

DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.plans CASCADE;

-- ===========================
-- plans (subscription tiers)
-- ===========================
CREATE TABLE public.plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  description     TEXT,
  amount_cents    INT NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'EGP',
  interval        plan_interval NOT NULL,
  features        JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  stripe_price_id TEXT,
  paymob_plan_id  TEXT,
  position        INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_plans_slug ON public.plans(slug);
CREATE INDEX idx_plans_is_active_position ON public.plans(is_active, position);

-- ===========================
-- leads (captured by forms)
-- ===========================
CREATE TABLE public.leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source          lead_source NOT NULL,
  status          lead_status NOT NULL DEFAULT 'new',
  name            TEXT,
  email           TEXT NOT NULL,
  phone           TEXT,
  company         TEXT,
  message         TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  tool_id         UUID REFERENCES public.tools(id) ON DELETE SET NULL,
  article_id      UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  ip_address      INET,
  user_agent      TEXT,
  assigned_to     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  contacted_at    TIMESTAMPTZ,
  converted_at    TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_source ON public.leads(source);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_tool_id ON public.leads(tool_id);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);

-- ===========================
-- subscriptions (user x plan)
-- ===========================
CREATE TABLE public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id                 UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  status                  subscription_status NOT NULL,
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN NOT NULL DEFAULT FALSE,
  canceled_at             TIMESTAMPTZ,
  trial_start             TIMESTAMPTZ,
  trial_end               TIMESTAMPTZ,
  stripe_subscription_id  TEXT UNIQUE,
  paymob_subscription_id  TEXT UNIQUE,
  metadata                JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan_id ON public.subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_current_period_end ON public.subscriptions(current_period_end);

-- ===========================
-- payments
-- ===========================
CREATE TABLE public.payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id   UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  plan_id           UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  amount_cents      INT NOT NULL,
  currency          TEXT NOT NULL,
  status            payment_status NOT NULL,
  payment_method    TEXT,                            -- 'stripe', 'paymob_card', 'paymob_wallet', etc.
  stripe_payment_id TEXT UNIQUE,
  paymob_payment_id TEXT UNIQUE,
  invoice_url       TEXT,
  receipt_url       TEXT,
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_subscription_id ON public.payments(subscription_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_created_at ON public.payments(created_at DESC);
