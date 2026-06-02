import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ToolCard } from "@/components/ui/tool-card";
import { CategoryCard } from "@/components/ui/category-card";
import { Button } from "@/components/ui/button";

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

export default async function Home() {
  const supabase = await createClient();

  let categories: Category[] = [];
  let featured: Tool[] = [];
  let totalTools = 0;

  if (supabase) {
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
              <Button asChild size="lg">
                <Link href="/tools">استكشف الأدوات</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/categories">تصفح الفئات</Link>
              </Button>
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

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} variant="compact" />
          ))}
        </div>
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

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
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
          <Button asChild size="lg" className="mt-8 bg-white text-violet-700 hover:bg-zinc-100">
            <Link href="/tools">ابدأ الاستكشاف</Link>
          </Button>
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
