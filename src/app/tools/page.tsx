import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ToolGrid } from "./tool-grid";
import { FilterSidebar } from "./filter-sidebar";
import { SearchBar } from "./search-bar";
import { SortDropdown } from "./sort-dropdown";
import { Pagination } from "./pagination";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "كل الأدوات",
  description:
    "تصفح كل أدوات الذكاء الاصطناعي المتاحة على AI.DY. فلتر بالفئة، السعر، والتقييم. قارن واختر الأنسب.",
  keywords: [
    "أدوات ذكاء اصطناعي",
    "ChatGPT",
    "Claude",
    "Midjourney",
    "مقارنة",
    "تقييمات",
  ],
  alternates: { canonical: "/tools" },
};

type SearchParams = {
  q?: string;
  category?: string;
  pricing?: string;
  min_rating?: string;
  sort?: string;
  page?: string;
};

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

const PAGE_SIZE = 12;

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Parse query params
  const q = (params.q ?? "").trim();
  const category = params.category;
  const pricing = params.pricing;
  const minRating = Number(params.min_rating ?? "0");
  const sort = params.sort ?? "rating";
  const page = Math.max(1, Number(params.page ?? "1"));

  // Fetch in parallel
  let categories: Array<{ id: string; slug: string; name: string; icon: string | null }> = [];
  let tools: Array<{
    id: string;
    slug: string;
    name: string;
    name_en: string;
    tagline: string | null;
    description: string | null;
    website_url: string | null;
    logo_url: string | null;
    pricing_type: string | null;
    starting_price: number | null;
    monthly_price: number | null;
    rating_avg: number | null;
    rating_count: number | null;
    category: { id: string; name: string; slug: string; icon: string | null; color: string | null } | null;
  }> = [];
  let totalCount = 0;

  if (supabase) {
    let toolsQuery = supabase
      .from("tools")
      .select(
        `id, slug, name, name_en, tagline, description, website_url, logo_url,
        pricing_type, starting_price, monthly_price, rating_avg, rating_count,
        category:categories(id, name, slug, icon, color)`,
        { count: "exact" }
      )
      .eq("is_published", true)
      .eq("status", "published");

    // Search
    if (q) {
      toolsQuery = toolsQuery.or(
        `name.ilike.%${q}%,name_en.ilike.%${q}%,tagline.ilike.%${q}%,description.ilike.%${q}%`
      );
    }

    // Filters
    if (category) toolsQuery = toolsQuery.eq("category.slug", category);
    if (pricing) toolsQuery = toolsQuery.eq("pricing_type", pricing);
    if (minRating > 0) toolsQuery = toolsQuery.gte("rating_avg", minRating);

    // Sort
    if (sort === "rating") toolsQuery = toolsQuery.order("rating_avg", { ascending: false });
    else if (sort === "newest") toolsQuery = toolsQuery.order("created_at", { ascending: false });
    else if (sort === "popular") toolsQuery = toolsQuery.order("views_count", { ascending: false });
    else if (sort === "name") toolsQuery = toolsQuery.order("name", { ascending: true });

    // Pagination
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    toolsQuery = toolsQuery.range(from, to);

    const [toolsRes, categoriesRes] = await Promise.all([
      toolsQuery,
      supabase
        .from("categories")
        .select("id, slug, name, icon")
        .eq("is_active", true)
        .order("position", { ascending: true }),
    ]);

    tools = (toolsRes.data as unknown as typeof tools) ?? [];
    totalCount = toolsRes.count ?? 0;
    categories = (categoriesRes.data as typeof categories) ?? [];
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <section className="border-b border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <nav className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-violet-600">الرئيسية</Link>
            <span className="mx-2">/</span>
            <span className="text-zinc-900 dark:text-zinc-100">كل الأدوات</span>
          </nav>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            كل أدوات الذكاء الاصطناعي
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {totalCount} أداة متاحة — فلتر، قارن، واختر الأنسب
          </p>

          {/* Search + Sort row */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <SearchBar initialQuery={q} />
            </div>
            <SortDropdown currentSort={sort} />
          </div>
        </div>
      </section>

      {/* Body: Sidebar + Grid */}
      <section className="mx-auto w-full max-w-7xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <FilterSidebar
              categories={categories.map((c) => ({
                ...c,
                emoji: categoryEmoji(c.icon),
              }))}
              currentCategory={category}
              currentPricing={pricing}
              currentMinRating={minRating}
            />
          </aside>

          {/* Grid + Pagination */}
          <div>
            {tools.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
                <p className="text-lg font-semibold">لا توجد أدوات</p>
                <p className="mt-2 text-sm text-zinc-500">
                  جرّب تعديل الفلاتر أو ابحث بكلمات مختلفة.
                </p>
                <Link
                  href="/tools"
                  className="mt-4 inline-block text-sm font-semibold text-violet-600 hover:text-violet-700"
                >
                  مسح كل الفلاتر ←
                </Link>
              </div>
            ) : (
              <>
                <Suspense fallback={null}>
                  <ToolGrid tools={tools} />
                </Suspense>
                {totalPages > 1 && (
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    basePath="/tools"
                    searchParams={params}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
