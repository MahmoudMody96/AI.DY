// ============================================
// AI.DY — Sponsored Slot component
// ============================================
// Server component that renders a "مُموَّل" (Sponsored) banner card
// pinning a specific tool to a fixed layout position.
//
// Usage:
//   <SponsoredSlot position="homepage_hero" />
//   <SponsoredSlot position="category_top" categoryId={category.id} />
//   <SponsoredSlot position="tools_sidebar" />
//
// When no active slot exists, the component renders nothing
// (returns null) so the calling page can drop it anywhere without
// a layout penalty.
// ============================================

import "server-only";
import Link from "next/link";
import { Megaphone, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ToolLogoServer } from "@/components/brand/tool-logo-server";

export type SponsoredPosition =
  | "homepage_hero"
  | "tools_sidebar"
  | "category_top";

type SponsoredSlotRow = {
  id: string;
  position: SponsoredPosition;
  tool_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  note: string | null;
};

type SponsoredTool = {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  tagline: string | null;
  website_url: string | null;
  affiliate_url: string | null;
  logo_url: string | null;
  category: { id: string; name: string; slug: string; color: string | null } | null;
};

type SponsoredJoined = SponsoredSlotRow & {
  tool: SponsoredTool | null;
};

async function loadActiveSlot(
  position: SponsoredPosition,
  categoryId?: string,
): Promise<SponsoredJoined | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  // Pull all currently-running active slots for this position, then
  // filter to the requested category (if any) in code. We can't push
  // the category filter into the query because the slot→tool link
  // is by tool_id, not category_id.
  const { data: slots, error } = await supabase
    .from("sponsored_slots")
    .select(
      `id, position, tool_id, starts_at, ends_at, status, note,
      tool:tools(
        id, slug, name, name_en, tagline, website_url, affiliate_url, logo_url,
        category:categories(id, name, slug, color)
      )`
    )
    .eq("position", position)
    .eq("status", "active")
    .lte("starts_at", new Date().toISOString())
    .gte("ends_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !slots || slots.length === 0) return null;
  const slot = (slots as unknown as SponsoredJoined[])[0];

  // If a categoryId is provided, the slot must be for a tool in that
  // category. Falls back to nothing.
  if (categoryId && slot.tool?.category?.id !== categoryId) {
    return null;
  }

  return slot;
}

function CardHomepage({ slot }: { slot: SponsoredJoined }) {
  const tool = slot.tool;
  if (!tool) return null;
  const href = tool.affiliate_url ?? tool.website_url ?? `/tools/${tool.slug}`;
  const isAffiliate = Boolean(tool.affiliate_url);
  return (
    <div className="overflow-hidden rounded-2xl border border-amber-300/60 bg-gradient-to-br from-amber-50 via-amber-50/60 to-orange-50/60 p-5 ring-1 ring-amber-200/40 shadow-sm dark:border-amber-700/40 dark:from-amber-950/30 dark:via-amber-950/15 dark:to-orange-950/20 dark:ring-amber-800/30">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card ring-1 ring-amber-200/60 dark:ring-amber-800/50">
          <ToolLogoServer
            slug={tool.slug}
            name={tool.name}
            size={36}
            rounded="lg"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
              <Megaphone className="h-3 w-3" />
              مُموَّل
            </span>
            {isAffiliate && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                عرض خاص
              </span>
            )}
          </div>
          <h3 className="text-base font-black leading-tight text-foreground">
            {tool.name}
          </h3>
          {tool.tagline && (
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
              {tool.tagline}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Link
          href={`/tools/${tool.slug}`}
          className="text-sm font-semibold text-foreground/80 hover:text-foreground"
        >
          اقرأ المراجعة ←
        </Link>
        <a
          href={href}
          target="_blank"
          rel="noopener sponsored nofollow"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-amber-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
        >
          {isAffiliate ? "جرب بخصم" : "زيارة الأداة"} ↗
        </a>
      </div>
    </div>
  );
}

function CardSidebar({ slot }: { slot: SponsoredJoined }) {
  const tool = slot.tool;
  if (!tool) return null;
  const href = tool.affiliate_url ?? tool.website_url ?? `/tools/${tool.slug}`;
  const isAffiliate = Boolean(tool.affiliate_url);
  return (
    <div className="rounded-2xl border border-amber-300/60 bg-gradient-to-br from-amber-50 to-orange-50/40 p-5 shadow-sm dark:border-amber-700/40 dark:from-amber-950/30 dark:to-orange-950/20">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
          <Megaphone className="h-3 w-3" />
          مُموَّل
        </span>
      </div>
      <div className="flex items-center gap-3">
        <ToolLogoServer
          slug={tool.slug}
          name={tool.name}
          size={40}
          rounded="lg"
        />
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-black">{tool.name}</h4>
          {tool.tagline && (
            <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
              {tool.tagline}
            </p>
          )}
        </div>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener sponsored nofollow"
        className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-amber-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700"
      >
        {isAffiliate ? "جرب بخصم" : "زيارة الأداة"} ↗
      </a>
    </div>
  );
}

function CardCategoryTop({ slot }: { slot: SponsoredJoined }) {
  const tool = slot.tool;
  if (!tool) return null;
  const href = tool.affiliate_url ?? tool.website_url ?? `/tools/${tool.slug}`;
  const isAffiliate = Boolean(tool.affiliate_url);
  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-amber-300/60 bg-gradient-to-l from-amber-50 via-amber-50/40 to-orange-50/30 p-5 shadow-sm dark:border-amber-700/40 dark:from-amber-950/30 dark:via-amber-950/15 dark:to-orange-950/15">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-card ring-1 ring-amber-200/60 dark:ring-amber-800/50">
          <ToolLogoServer
            slug={tool.slug}
            name={tool.name}
            size={44}
            rounded="xl"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
              <Megaphone className="h-3 w-3" />
              مُموَّل · {tool.category?.name ?? "أداة مميزة"}
            </span>
          </div>
          <h3 className="text-lg font-black leading-tight">{tool.name}</h3>
          {tool.tagline && (
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
              {tool.tagline}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/tools/${tool.slug}`}
            className="inline-flex h-10 items-center justify-center rounded-full border border-amber-300 bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-amber-100/40 dark:border-amber-700/60 dark:hover:bg-amber-900/30"
          >
            اقرأ المراجعة
          </Link>
          <a
            href={href}
            target="_blank"
            rel="noopener sponsored nofollow"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-amber-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
          >
            {isAffiliate ? "جرب بخصم" : "زيارة الأداة"} ↗
            <ArrowLeft className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

export async function SponsoredSlot({
  position,
  categoryId,
  className,
}: {
  position: SponsoredPosition;
  categoryId?: string;
  className?: string;
}) {
  const slot = await loadActiveSlot(position, categoryId);
  if (!slot) return null;

  return (
    <div className={className} data-sponsored-slot={position}>
      {position === "homepage_hero" && <CardHomepage slot={slot} />}
      {position === "tools_sidebar" && <CardSidebar slot={slot} />}
      {position === "category_top" && <CardCategoryTop slot={slot} />}
    </div>
  );
}
