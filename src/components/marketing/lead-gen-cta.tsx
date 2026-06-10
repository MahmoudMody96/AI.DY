// ============================================
// AI.DY — LeadGenCta
// ============================================
// Static "want an app like AI.DY? Talk on WhatsApp" card.
// Server component (no client state) — drop anywhere.
//
// Variants:
//   - default: full card with icon, headline, body, big WhatsApp button
//   - compact: sidebar-friendly card
//   - inline:  horizontal banner (use above sections or in footers)
//
// The WhatsApp link is a constant — we don't track clicks on the
// CTA itself; we trust WhatsApp to handle the conversation.
// ============================================

import "server-only";
import Link from "next/link";
import { MessageCircle, Sparkles, ArrowLeft } from "lucide-react";

export const LEAD_WHATSAPP_NUMBER = "201234567890";
export const LEAD_WHATSAPP_TEXT =
  "مرحبًا محمود — عايز تطبيق زي AI.DY لمشروعي.";

export function getLeadWhatsAppUrl(source?: string): string {
  const base = `https://wa.me/${LEAD_WHATSAPP_NUMBER}?text=${encodeURIComponent(LEAD_WHATSAPP_TEXT)}`;
  if (!source) return base;
  return `${base}%20(${encodeURIComponent(source)})`;
}

function CardDefault({ source }: { source?: string }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-500/15 via-violet-500/5 to-cyan-500/10 p-8 text-center sm:p-12">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-700 dark:text-violet-300">
        <Sparkles className="h-6 w-6" />
      </div>
      <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
        عايز تطبيق زي AI.DY لمشروعك؟
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
        بنبني منصات Demo-First لشركات ومتاجر في أسبوعين — مع لوحة إدارة،
        صفحة أدوات، تقييمات، ودعم عربي كامل.
      </p>
      <a
        href={getLeadWhatsAppUrl(source)}
        target="_blank"
        rel="noopener noreferrer"
        data-lead-cta="default"
        data-cta-source={source ?? "default"}
        className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-violet-600 px-8 text-base font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:bg-violet-700"
      >
        <MessageCircle className="h-4 w-4" />
        تواصل معانا على واتساب
      </a>
      <p className="mt-4 text-xs text-muted-foreground">
        هنرد عليك خلال 24 ساعة
      </p>
    </div>
  );
}

function CardCompact({ source }: { source?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent p-6">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/20 text-violet-700 dark:text-violet-300">
        <Sparkles className="h-5 w-5" />
      </div>
      <h3 className="text-base font-black leading-tight">
        عايز تطبيق زي AI.DY؟
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        بنبني منصات Demo-First لشركات ومتاجر. تواصل معانا وهنرجع
        لك خلال 24 ساعة.
      </p>
      <a
        href={getLeadWhatsAppUrl(source)}
        target="_blank"
        rel="noopener noreferrer"
        data-lead-cta="compact"
        data-cta-source={source ?? "compact"}
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:bg-violet-700"
      >
        <MessageCircle className="h-4 w-4" />
        تواصل عبر واتساب
      </a>
    </div>
  );
}

function CardInline({ source }: { source?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-l from-violet-500/10 via-violet-500/5 to-cyan-500/5 p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-700 dark:text-violet-300">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight">
            بنبني منصات Demo-First لشركات ومتاجر
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            لوحة إدارة، صفحة أدوات، تقييمات، ودعم عربي
          </p>
        </div>
        <a
          href={getLeadWhatsAppUrl(source)}
          target="_blank"
          rel="noopener noreferrer"
          data-lead-cta="inline"
          data-cta-source={source ?? "inline"}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-violet-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          تواصل واتساب
          <ArrowLeft className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

export function LeadGenCta({
  variant = "default",
  source,
  className,
}: {
  variant?: "default" | "compact" | "inline";
  source?: string;
  className?: string;
}) {
  return (
    <div className={className} data-lead-gen-cta={variant}>
      {variant === "default" && <CardDefault source={source} />}
      {variant === "compact" && <CardCompact source={source} />}
      {variant === "inline" && <CardInline source={source} />}
    </div>
  );
}

// Re-export so pages can link to Mahmoud's profile if needed
export function LeadWhatsAppLink({
  children,
  className,
  source,
}: {
  children: React.ReactNode;
  className?: string;
  source?: string;
}) {
  return (
    <Link
      href={getLeadWhatsAppUrl(source)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </Link>
  );
}
