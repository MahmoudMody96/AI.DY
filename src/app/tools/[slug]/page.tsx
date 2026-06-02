import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ToolGrid } from "../tool-grid";
import type { Metadata } from "next";

const CATEGORY_ICONS: Record<string, string> = {
  Bot: "🤖",
  PenTool: "✍️",
  ImageIcon: "🎨",
  Code: "💻",
  Video: "🎬",
  Music: "🎵",
  Workflow: "⚙️",
  Search: "🔍",
};

function categoryEmoji(icon: string | null | undefined): string {
  if (!icon) return "✨";
  return CATEGORY_ICONS[icon] ?? "✨";
}

function pricingLabel(type: string | null, monthly: number | null): string {
  if (type === "free") return "مجاني بالكامل";
  if (type === "freemium") return "مجاني + مدفوع";
  if (type === "paid" && monthly != null) return `${monthly}$ شهرياً`;
  if (type === "paid") return "مدفوع";
  return "—";
}

function pricingColor(type: string | null): string {
  if (type === "free") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300";
  if (type === "freemium") return "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300";
  if (type === "paid") return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300";
  return "bg-zinc-100 text-zinc-700";
}

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  if (!supabase) return { title: "أداة غير موجودة | AI.DY" };

  const { data: tool } = await supabase
    .from("tools")
    .select("name, name_en, tagline, description, seo_title, seo_description")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!tool) return { title: "أداة غير موجودة | AI.DY" };

  return {
    title: tool.seo_title ?? `${tool.name} | AI.DY`,
    description: tool.seo_description ?? tool.tagline ?? tool.description ?? undefined,
  };
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
      `id, slug, name, name_en, tagline, description, website_url, logo_url,
      pricing_type, starting_price, monthly_price, rating_avg, rating_count,
      views_count, is_featured, tags, created_at, updated_at,
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

  return (
    <div className="flex flex-col flex-1">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <nav className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-violet-600">الرئيسية</Link>
            <span className="mx-2">/</span>
            <Link href="/tools" className="hover:text-violet-600">الأدوات</Link>
            {toolCategory && (
              <>
                <span className="mx-2">/</span>
                <Link
                  href={`/categories/${toolCategory.slug}`}
                  className="hover:text-violet-600"
                >
                  {toolCategory.name}
                </Link>
              </>
            )}
            <span className="mx-2">/</span>
            <span className="text-zinc-900 dark:text-zinc-100">{tool.name}</span>
          </nav>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Logo / Icon */}
            <div
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl text-5xl"
              style={{ backgroundColor: `${toolCategory?.color ?? "#7c3aed"}20` }}
            >
              {categoryEmoji(toolCategory?.icon)}
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
                <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
                  {tool.tagline}
                </p>
              )}

              {/* Rating + Pricing inline */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                {tool.rating_avg != null && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-500">⭐</span>
                    <span className="font-bold">{tool.rating_avg.toFixed(1)}</span>
                    {tool.rating_count != null && (
                      <span className="text-zinc-500">({tool.rating_count.toLocaleString("ar-EG")} تقييم)</span>
                    )}
                  </div>
                )}
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pricingColor(tool.pricing_type)}`}>
                  {pricingLabel(tool.pricing_type, tool.monthly_price)}
                </span>
              </div>

              {/* CTA */}
              {tool.website_url && (
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={tool.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-violet-600 px-8 text-base font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:bg-violet-700"
                  >
                    زيارة الموقع الرسمي ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Body: description + sidebar */}
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
          {/* Main content */}
          <article>
            <h2 className="text-2xl font-bold tracking-tight">عن {tool.name}</h2>
            <div className="prose prose-zinc mt-4 max-w-none dark:prose-invert">
              <p className="text-lg leading-8 text-zinc-700 dark:text-zinc-300">
                {tool.description ?? tool.tagline}
              </p>
            </div>

            {tool.tags && tool.tags.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                  الوسوم
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tool.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                معلومات سريعة
              </h3>
              <dl className="mt-4 space-y-3 text-sm">
                {tool.pricing_type && (
                  <div>
                    <dt className="text-zinc-500">التسعير</dt>
                    <dd className="font-semibold">{pricingLabel(tool.pricing_type, tool.monthly_price)}</dd>
                  </div>
                )}
                {tool.starting_price != null && tool.starting_price > 0 && (
                  <div>
                    <dt className="text-zinc-500">يبدأ من</dt>
                    <dd className="font-semibold">${tool.starting_price}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-zinc-500">المشاهدات</dt>
                  <dd className="font-semibold">{(tool.views_count ?? 0).toLocaleString("ar-EG")}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">آخر تحديث</dt>
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
          </aside>
        </div>
      </section>

      {/* Related tools */}
      {relatedTools.length > 0 && (
        <section className="border-t border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30">
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
