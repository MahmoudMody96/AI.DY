import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Sparkles, MessageCircle, Lightbulb, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ToolGrid } from "@/components/tools/tool-grid";
import { ToolLogoServer } from "@/components/brand/tool-logo-server";
import { Container } from "@/components/layout/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { RatingStars } from "@/components/ui/rating-stars";
import { EmptyState } from "@/components/ui/empty-state";
import type { Metadata } from "next";

const ICON_EMOJI: Record<string, string> = {
  PenTool: "✍️",
  ImageIcon: "🎨",
  Bot: "🤖",
  Code: "💻",
  Headphones: "🎧",
  Search: "🔍",
  BookOpen: "📚",
  Phone: "📞",
  BarChart3: "📊",
  Globe: "🌐",
  Briefcase: "💼",
  Megaphone: "📣",
};

// Mahmoud's WhatsApp link (wa.me) — used for the "عايز تطبيق زي AI.DY" CTA
const MAHMOUD_WHATSAPP = "https://wa.me/201234567890?text=" +
  encodeURIComponent(
    "مرحبًا محمود — عايز تطبيق زي AI.DY لمشروعي."
  );

type Params = { slug: string };

type UseCaseRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string | null;
  cover_image: string | null;
  related_tool_ids: string[];
  seo_keywords: string[];
  created_at: string;
  updated_at: string;
};

type RelatedTool = {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  tagline: string | null;
  website_url: string | null;
  logo_url: string | null;
  pricing_type: string | null;
  monthly_price: number | null;
  rating_avg: number | null;
  rating_count: number | null;
  category: { id: string; name: string; slug: string; icon: string | null; color: string | null } | null;
};

function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000")
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;

  const readableTitle = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  try {
    const supabase = await createClient();
    if (!supabase) {
      return {
        title: readableTitle,
        alternates: { canonical: `/use-cases/${slug}` },
      };
    }

    const { data: useCase } = await supabase
      .from("use_cases")
      .select("title, description, seo_keywords")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle<{
        title: string;
        description: string;
        seo_keywords: string[] | null;
      }>();

    if (!useCase) {
      return {
        title: readableTitle,
        alternates: { canonical: `/use-cases/${slug}` },
      };
    }

    return {
      title: useCase.title,
      description: useCase.description,
      keywords: useCase.seo_keywords ?? undefined,
      alternates: { canonical: `/use-cases/${slug}` },
      openGraph: {
        title: useCase.title,
        description: useCase.description,
        type: "article",
      },
    };
  } catch {
    return { title: readableTitle };
  }
}

export default async function UseCaseDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  if (!supabase) notFound();

  // Fetch use case
  const { data: useCaseData, error: useCaseError } = await supabase
    .from("use_cases")
    .select(
      "id, slug, title, description, icon, cover_image, related_tool_ids, seo_keywords, created_at, updated_at"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle<UseCaseRow>();

  if (useCaseError || !useCaseData) notFound();

  // Fetch related tools by IDs
  let relatedTools: RelatedTool[] = [];
  if (useCaseData.related_tool_ids.length > 0) {
    const { data } = await supabase
      .from("tools")
      .select(
        `id, slug, name, name_en, tagline, website_url, logo_url,
        pricing_type, monthly_price, rating_avg, rating_count,
        category:categories(id, name, slug, icon, color)`
      )
      .in("id", useCaseData.related_tool_ids)
      .eq("is_published", true)
      .eq("status", "published");

    // Preserve the order defined in related_tool_ids
    const orderMap = new Map(
      useCaseData.related_tool_ids.map((id, idx) => [id, idx])
    );
    const fetched = (data as unknown as RelatedTool[]) ?? [];
    relatedTools = [...fetched].sort(
      (a, b) =>
        (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999)
    );
  }

  const emoji = useCaseData.icon ? ICON_EMOJI[useCaseData.icon] ?? "✨" : "✨";
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/use-cases/${useCaseData.slug}`;

  // JSON-LD: Article (matches the spec's "JSON-LD Article" requirement)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: useCaseData.title,
    description: useCaseData.description,
    url: pageUrl,
    datePublished: useCaseData.created_at,
    dateModified: useCaseData.updated_at,
    inLanguage: "ar",
    publisher: {
      "@type": "Organization",
      name: "AI.DY",
      url: siteUrl,
    },
    keywords: useCaseData.seo_keywords?.join(", ") ?? undefined,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: relatedTools.map((t, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: t.name,
        url: `${siteUrl}/tools/${t.slug}`,
      })),
    },
  };

  // Split description into paragraphs for cleaner reading. Most use case
  // descriptions are 2-3 sentences; we split on `.` boundaries that look
  // like sentence ends (followed by a space and a capital or Arabic char).
  const paragraphs = useCaseData.description
    .split(/(?<=[.!?])\s+/)
    .filter((p) => p.trim().length > 0);

  const breadcrumbItems = [
    { label: "الرئيسية", href: "/" },
    { label: "حالات الاستخدام", href: "/use-cases" },
    { label: useCaseData.title },
  ];

  return (
    <article className="flex flex-col flex-1">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-muted/30">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5"
        />
        <Container className="relative py-10 sm:py-12">
          <Breadcrumb items={breadcrumbItems} />

          <div className="flex items-start gap-5">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 text-3xl ring-1 ring-border"
              aria-hidden
            >
              {emoji}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                {useCaseData.title}
              </h1>
              <p className="mt-3 max-w-3xl text-lg text-muted-foreground">
                {paragraphs[0] ?? useCaseData.description}
              </p>
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                {relatedTools.length}{" "}
                {relatedTools.length === 1
                  ? "أداة موصى بها"
                  : "أدوات موصى بها"}{" "}
                ·{" "}
                <span className="inline-flex items-center gap-1">
                  <Wrench className="h-3.5 w-3.5" />
                  مختارة بعناية
                </span>
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Body: description */}
      <section className="py-12">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
            <div>
              <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
                <Lightbulb className="h-3.5 w-3.5" />
                عن حالة الاستخدام
              </div>

              <div className="prose prose-zinc max-w-none dark:prose-invert prose-p:leading-8 prose-p:text-foreground/80">
                {paragraphs.length > 0 ? (
                  paragraphs.map((p, i) => (
                    <p
                      key={i}
                      className={
                        i === 0
                          ? "text-xl font-medium leading-9"
                          : "text-base leading-8"
                      }
                    >
                      {p}
                    </p>
                  ))
                ) : (
                  <p>{useCaseData.description}</p>
                )}
              </div>

              {/* SEO keywords */}
              {useCaseData.seo_keywords && useCaseData.seo_keywords.length > 0 && (
                <div className="mt-8 border-t border-border pt-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    كلمات مفتاحية
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {useCaseData.seo_keywords.map((k) => (
                      <span
                        key={k}
                        className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground"
                      >
                        #{k}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar CTA */}
            <aside className="lg:sticky lg:top-6 lg:self-start">
              <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent p-6">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/20 text-violet-700 dark:text-violet-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-base font-black leading-tight">
                  عايز تطبيق زي AI.DY لمشروعك؟
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  بنبني منصات Demo-First لشركات ومتاجر. تواصل معانا وهنرجع
                  لك خلال 24 ساعة.
                </p>
                <a
                  href={MAHMOUD_WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:bg-violet-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  تواصل عبر واتساب
                </a>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      {/* Recommended tools */}
      <section className="border-t border-border bg-muted/30">
        <Container className="py-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
                <Wrench className="h-3.5 w-3.5" />
                الأدوات الموصى بها
              </p>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                أفضل {relatedTools.length > 0 ? relatedTools.length : ""} أداة لـ {useCaseData.title}
              </h2>
            </div>
          </div>

          {relatedTools.length === 0 ? (
            <EmptyState
              title="لا توجد أدوات مرتبطة بعد"
              description="ستظهر الأدوات الموصى بها هنا حال إضافتها."
            />
          ) : (
            <>
              {/* Compact tool list — better for use-case pages than the
                  full ToolCard grid: shows logo + name + rating + CTA */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedTools.map((tool) => (
                  <Link
                    key={tool.id}
                    href={`/tools/${tool.slug}`}
                    className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-violet-500/40 hover:shadow-[0_8px_32px_-8px_rgba(124,58,237,0.18)]"
                  >
                    <ToolLogoServer
                      slug={tool.slug}
                      name={tool.name}
                      size={48}
                      rounded="xl"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-bold text-card-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400">
                        {tool.name}
                      </h3>
                      {tool.tagline && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {tool.tagline}
                        </p>
                      )}
                      {tool.rating_avg != null && (
                        <div className="mt-1.5">
                          <RatingStars
                            rating={tool.rating_avg}
                            count={tool.rating_count}
                            showCount
                            className="text-xs"
                          />
                        </div>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:-translate-x-1 group-hover:text-violet-600" />
                  </Link>
                ))}
              </div>

              {/* Full tool grid below — gives detail when a user wants to compare */}
              <div className="mt-10">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  تفاصيل أكثر
                </h3>
                <ToolGrid tools={relatedTools} />
              </div>
            </>
          )}
        </Container>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-border">
        <Container className="py-12">
          <div className="overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-500/15 via-violet-500/5 to-cyan-500/10 p-8 text-center sm:p-12">
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              عايز تطبيق زي AI.DY؟
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
              بنبني منصات Demo-First لشركات ومتاجر في أسبوعين — مع لوحة
              إدارة، صفحة أدوات، تقييمات، ودعم عربي كامل.
            </p>
            <a
              href={MAHMOUD_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-violet-600 px-8 text-base font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:bg-violet-700"
            >
              <MessageCircle className="h-4 w-4" />
              تواصل معانا على واتساب
            </a>
          </div>
        </Container>
      </section>
    </article>
  );
}
