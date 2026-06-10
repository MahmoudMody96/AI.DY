import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ToolGrid } from "../tool-grid";
import { ToolLogoServer } from "@/components/brand/tool-logo-server";
import { ReviewsSection } from "@/components/reviews/reviews-section";
import { Container } from "@/components/layout/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { RatingStars } from "@/components/ui/rating-stars";
import { PricingBadge } from "@/components/ui/pricing-badge";
import { PricingLabel } from "@/components/ui/pricing-label";
import { DemoRenderer } from "@/components/demos/demo-renderer";
import { SponsoredSlot } from "@/components/marketing/sponsored-slot";
import { LeadGenCta } from "@/components/marketing/lead-gen-cta";
import { Gift, ExternalLink } from "lucide-react";
import type { Metadata } from "next";

const CATEGORY_ICONS_UNUSED = {
  // Kept for backward-compat with any imports; emoji icons are being phased out
  // in favor of real brand logos via ToolLogoServer.
  Bot: "🤖",
  PenTool: "✍️",
  ImageIcon: "🎨",
  Code: "💻",
  Video: "🎬",
  Music: "🎵",
  Workflow: "⚙️",
  Search: "🔍",
} as const;

function categoryEmoji(icon: string | null | undefined): string {
  if (!icon) return "✨";
  return CATEGORY_ICONS_UNUSED[icon as keyof typeof CATEGORY_ICONS_UNUSED] ?? "✨";
}

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;

  // Format slug to a readable title as a safe default
  const readableTitle = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  try {
    const supabase = await createClient();
    if (!supabase) {
      return {
        title: readableTitle,
        alternates: { canonical: `/tools/${slug}` },
      };
    }

    const { data: tool } = await supabase
      .from("tools")
      .select("name, tagline, description, seo_title, seo_description")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (!tool) {
      return {
        title: readableTitle,
        description: `اقرأ عن ${readableTitle} — أداة ذكاء اصطناعي.`,
        alternates: { canonical: `/tools/${slug}` },
      };
    }

    return {
      // The root layout applies a `%s | AI.DY` template, so return the
      // raw name here. Strip the suffix if seo_title already includes it.
      title: tool.seo_title?.replace(/\s*\|\s*AI\.DY\s*$/i, "") ?? tool.name,
      description:
        tool.seo_description ??
        tool.tagline ??
        tool.description ??
        `اقرأ عن ${tool.name} — أداة ذكاء اصطناعي.`,
      alternates: { canonical: `/tools/${slug}` },
    };
  } catch {
    return { title: readableTitle };
  }
}

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  if (!supabase) notFound();

  // Fetch tool + related tools in parallel
  const toolQuery = supabase
    .from("tools")
    .select(
      `id, slug, name, name_en, tagline, description, website_url, affiliate_url, logo_url,
      pricing_type, starting_price, monthly_price, rating_avg, rating_count,
      views_count, is_featured, tags, created_at, updated_at,
      demo_type, demo_config,
      category:categories(id, slug, name, name_en, icon, color)`
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("status", "published")
    .maybeSingle();

  const { data: tool, error } = await toolQuery;
  if (error || !tool) notFound();

  // Increment views (fire and forget — don't await, don't block render)
  void supabase
    .from("tools")
    .update({ views_count: (tool.views_count ?? 0) + 1 })
    .eq("id", tool.id);

  // Related tools: same category, exclude current
  const toolCategory = (Array.isArray(tool.category) ? tool.category[0] : tool.category) as
    | { id: string; slug: string; name: string; name_en: string; icon: string | null; color: string | null }
    | null
    | undefined;
  const categoryId = toolCategory?.id;
  let relatedTools: Array<{
    id: string;
    slug: string;
    name: string;
    name_en: string;
    tagline: string | null;
    website_url: string | null;
    pricing_type: string | null;
    monthly_price: number | null;
    rating_avg: number | null;
    category: { id: string; name: string; slug: string; icon: string | null; color: string | null } | null;
  }> = [];

  if (categoryId) {
    const { data } = await supabase
      .from("tools")
      .select(
        `id, slug, name, name_en, tagline, website_url, pricing_type, monthly_price, rating_avg,
        category:categories(id, name, slug, icon, color)`
      )
      .eq("is_published", true)
      .eq("status", "published")
      .eq("category_id", categoryId)
      .neq("id", tool.id)
      .order("rating_avg", { ascending: false })
      .limit(4);
    relatedTools = (data as unknown as typeof relatedTools) ?? [];
  }

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    alternateName: tool.name_en ?? undefined,
    description: tool.tagline ?? tool.description ?? undefined,
    url: tool.website_url ?? undefined,
    applicationCategory: "AIApplication",
    operatingSystem: "Web",
    offers: tool.pricing_type
      ? {
          "@type": "Offer",
          price: tool.monthly_price ?? tool.starting_price ?? 0,
          priceCurrency: "USD",
        }
      : undefined,
    aggregateRating: tool.rating_avg
      ? {
          "@type": "AggregateRating",
          ratingValue: tool.rating_avg,
          ratingCount: tool.rating_count ?? 0,
        }
      : undefined,
  };

  const breadcrumbItems = [
    { label: "الرئيسية", href: "/" },
    { label: "الأدوات", href: "/tools" },
    ...(toolCategory
      ? [{ label: toolCategory.name, href: `/categories/${toolCategory.slug}` }]
      : []),
    { label: tool.name },
  ];

  return (
    <div className="flex flex-col flex-1">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="border-b border-border">
        <Container className="py-10">
          <Breadcrumb items={breadcrumbItems} />

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Logo / Icon */}
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-card p-2 ring-1 ring-border">
              <ToolLogoServer
                slug={tool.slug}
                name={tool.name}
                size={80}
                rounded="xl"
              />
            </div>

            {/* Title + meta */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {toolCategory && (
                  <Link
                    href={`/categories/${toolCategory.slug}`}
                    className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100 dark:bg-violet-950/50 dark:text-violet-300 dark:hover:bg-violet-950"
                  >
                    {toolCategory.name}
                  </Link>
                )}
                {tool.is_featured && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                    ⭐ مميز
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                {tool.name}
              </h1>
              {tool.tagline && (
                <p className="mt-2 text-lg text-muted-foreground">
                  {tool.tagline}
                </p>
              )}

              {/* Rating + Pricing inline */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                {tool.rating_avg != null && (
                  <RatingStars
                    rating={tool.rating_avg}
                    count={tool.rating_count}
                    showCount
                  />
                )}
                <PricingBadge type={tool.pricing_type} monthly={tool.monthly_price} />
              </div>

              {/* CTA */}
              {(tool.website_url || tool.affiliate_url) && (
                <div className="mt-6 flex flex-wrap gap-3">
                  {tool.website_url && (
                    <a
                      href={tool.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-12 items-center justify-center rounded-full border border-violet-600 bg-background px-6 text-base font-semibold text-violet-700 transition hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/40"
                    >
                      <ExternalLink className="ms-2 h-4 w-4" />
                      زيارة الموقع الرسمي
                    </a>
                  )}
                  {tool.affiliate_url && (
                    <a
                      href={tool.affiliate_url}
                      target="_blank"
                      rel="noopener sponsored nofollow"
                      data-affiliate-button
                      data-tool-slug={tool.slug}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-7 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-600 hover:to-emerald-700"
                    >
                      <Gift className="h-4 w-4" />
                      جرب الأداة بخصم
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Live Demo (Phase 1.4) — rendered when tool.demo_type is set.
          Sits between the hero and the body, in keeping with the
          "demo-first" product philosophy. DemoRenderer is a no-op
          when demo_type is null. */}
      {tool.demo_type && (
        <DemoRenderer
          tool={{
            id: tool.id,
            slug: tool.slug,
            name: tool.name,
            name_en: tool.name_en,
            color: null,
            demo_type: tool.demo_type,
            demo_config: tool.demo_config,
          }}
        />
      )}

      {/* Body: description + sidebar */}
      <section className="py-12">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
            {/* Main content */}
            <article>
              <h2 className="text-2xl font-bold tracking-tight">عن {tool.name}</h2>
              <div className="prose prose-zinc mt-4 max-w-none dark:prose-invert">
                <p className="text-lg leading-8 text-foreground/80">
                  {tool.description ?? tool.tagline}
                </p>
              </div>

              {tool.tags && tool.tags.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    الوسوم
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tool.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* Sidebar */}
            <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              {/* Sponsored slot (top of sidebar when present) */}
              <SponsoredSlot position="tools_sidebar" />

              {/* Quick info card */}
              <div className="rounded-2xl border border-border bg-muted/30 p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  معلومات سريعة
                </h3>
                <dl className="mt-4 space-y-3 text-sm">
                  {tool.pricing_type && (
                    <div>
                      <dt className="text-muted-foreground">التسعير</dt>
                      <dd className="font-semibold">
                        <PricingBadge type={tool.pricing_type} monthly={tool.monthly_price} />
                      </dd>
                    </div>
                  )}
                  {tool.starting_price != null && tool.starting_price > 0 && (
                    <div>
                      <dt className="text-muted-foreground">يبدأ من</dt>
                      <dd className="font-semibold">
                        <PricingLabel variant="starting" starting={tool.starting_price} />
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-muted-foreground">المشاهدات</dt>
                    <dd className="font-semibold">
                      {(tool.views_count ?? 0).toLocaleString("ar-EG")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">آخر تحديث</dt>
                    <dd className="font-semibold">
                      {new Date(tool.updated_at).toLocaleDateString("ar-EG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Lead-gen CTA (Phase 4.0) */}
              <LeadGenCta variant="compact" />
            </aside>
          </div>
        </Container>
      </section>

      {/* Reviews & Ratings (Phase 1.3) */}
      <ReviewsSection
        toolId={tool.id}
        ratingAvg={tool.rating_avg != null ? Number(tool.rating_avg) : null}
        ratingCount={tool.rating_count != null ? Number(tool.rating_count) : null}
      />

      {/* Related tools */}
      {relatedTools.length > 0 && (
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <h2 className="mb-6 text-2xl font-bold tracking-tight">
              أدوات مشابهة في {toolCategory?.name}
            </h2>
            <ToolGrid tools={relatedTools} />
          </div>
        </section>
      )}
    </div>
  );
}
