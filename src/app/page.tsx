import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Category = {
  id: string;
  slug: string;
  name: string;
  name_en: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  position: number | null;
};

type Tool = {
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
  is_featured: boolean | null;
  category: Pick<Category, "id" | "name" | "slug" | "icon" | "color"> | null;
};

const CATEGORY_ICON_MAP: Record<string, string> = {
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
  return CATEGORY_ICON_MAP[icon] ?? "✨";
}

function pricingLabel(type: string | null, monthly: number | null): string {
  if (type === "free") return "مجاني";
  if (type === "freemium") return "مجاني + مدفوع";
  if (type === "paid" && monthly != null) return `$${monthly}/شهر`;
  if (type === "paid") return "مدفوع";
  return "—";
}

export default async function Home() {
  const supabase = await createClient();

  // Default empty state if Supabase is not configured (e.g. missing env vars)
  let categories: Category[] = [];
  let featured: Tool[] = [];
  let totalTools = 0;

  if (supabase) {
    // Fetch in parallel
    const [categoriesRes, featuredRes, statsRes] = await Promise.all([
      supabase
        .from("categories")
        .select("id, slug, name, name_en, description, icon, color, position")
        .eq("is_active", true)
        .order("position", { ascending: true }),
      supabase
        .from("tools")
        .select(
          "id, slug, name, name_en, tagline, description, website_url, logo_url, pricing_type, starting_price, monthly_price, rating_avg, rating_count, is_featured, category:categories(id, name, slug, icon, color)"
        )
        .eq("is_published", true)
        .eq("is_featured", true)
        .order("rating_avg", { ascending: false })
        .limit(6),
      supabase.from("tools").select("id", { count: "exact", head: true }),
    ]);

    categories = (categoriesRes.data as Category[] | null) ?? [];
    featured = (featuredRes.data as unknown as Tool[] | null) ?? [];
    totalTools = statsRes.count ?? 0;
  }

  return (
    <div className="flex flex-col flex-1">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden border-b border-zinc-200 dark:border-zinc-800">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-violet-50 via-white to-amber-50 dark:from-violet-950/20 dark:via-zinc-950 dark:to-amber-950/20" />
        <div className="absolute inset-0 -z-10 opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]">
          <div className="absolute top-1/4 right-1/4 h-72 w-72 rounded-full bg-violet-400 blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 h-72 w-72 rounded-full bg-amber-400 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="flex flex-col items-center text-center">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
              <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
              {totalTools} أداة متاحة ومراجعة
            </span>
            <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
              دليلك لـ{" "}
              <span className="gradient-text">أدوات الذكاء الاصطناعي</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              اكتشف، قارن، واختر أفضل أدوات الذكاء الاصطناعي بالعربية.
              مراجعات، أسعار، وبدائل لكل أداة تحتاجها في شغلك أو حياتك اليومية.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/tools"
                className="inline-flex h-12 items-center justify-center rounded-full bg-violet-600 px-8 text-base font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:bg-violet-700"
              >
                استكشف الأدوات
              </Link>
              <Link
                href="/categories"
                className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 bg-white px-8 text-base font-semibold text-zinc-900 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                تصفح الفئات
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Categories ===== */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">الفئات</h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              اختر فئتك وابدأ في استكشاف الأدوات المناسبة لاحتياجك
            </p>
          </div>
          <Link
            href="/categories"
            className="hidden text-sm font-semibold text-violet-600 hover:text-violet-700 sm:inline-block"
          >
            عرض الكل ←
          </Link>
        </div>

        {categories.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700">
            لا توجد فئات متاحة حاليًا.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div
                  className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                  style={{
                    backgroundColor: cat.color ? `${cat.color}1A` : "#7c3aed1A",
                  }}
                >
                  {categoryEmoji(cat.icon)}
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50">
                  {cat.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {cat.description ?? cat.name_en}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ===== Featured Tools ===== */}
      <section className="border-y border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                الأدوات المميزة ⭐
              </h2>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                أفضل {featured.length} أدوات مختارة بناءً على التقييمات
              </p>
            </div>
            <Link
              href="/tools"
              className="hidden text-sm font-semibold text-violet-600 hover:text-violet-700 sm:inline-block"
            >
              كل الأدوات ←
            </Link>
          </div>

          {featured.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700">
              لا توجد أدوات مميزة حاليًا.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((tool) => (
                <Link
                  key={tool.id}
                  href={`/tools/${tool.slug}`}
                  className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold text-white"
                      style={{
                        backgroundColor:
                          tool.category?.color ?? "#7c3aed",
                      }}
                    >
                      {categoryEmoji(tool.category?.icon)}
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                      ⭐ {tool.rating_avg?.toFixed(1) ?? "—"}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                    {tool.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {tool.tagline ?? tool.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-5 text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {tool.category?.name ?? "—"}
                    </span>
                    <span className="font-semibold text-violet-600 dark:text-violet-400">
                      {pricingLabel(tool.pricing_type, tool.monthly_price)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-amber-500 p-10 text-center text-white sm:p-16">
          <h2 className="text-3xl font-black sm:text-4xl">
            جاهز تختار أداة الذكاء الاصطناعي المناسبة؟
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
            قارن بين {totalTools} أداة في {categories.length} فئات. كل اللي
            محتاجه في مكان واحد.
          </p>
          <Link
            href="/tools"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-base font-semibold text-violet-700 transition hover:bg-zinc-100"
          >
            ابدأ الاستكشاف
          </Link>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-zinc-200 bg-white py-10 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <p className="text-sm text-zinc-500">
            © 2026 AI.DY — كل الحقوق محفوظة.
          </p>
          <p className="text-sm text-zinc-500">
            صنع بـ ❤️ للمجتمع العربي
          </p>
        </div>
      </footer>
    </div>
  );
}
