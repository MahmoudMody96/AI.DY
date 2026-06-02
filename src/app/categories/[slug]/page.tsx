import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ToolGrid } from "../../tools/tool-grid";
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

type Params = { slug: string };

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
        alternates: { canonical: `/categories/${slug}` },
      };
    }

    const { data: category } = await supabase
      .from("categories")
      .select("name, description, seo_title, seo_description")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (!category) {
      return {
        title: readableTitle,
        alternates: { canonical: `/categories/${slug}` },
      };
    }

    return {
      title: category.seo_title?.replace(/\s*\|\s*AI\.DY\s*$/i, "") ?? category.name,
      description:
        category.seo_description ??
        category.description ??
        `أفضل أدوات ${category.name} بالعربية.`,
      alternates: { canonical: `/categories/${slug}` },
    };
  } catch {
    return { title: readableTitle };
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  if (!supabase) notFound();

  // Step 1: fetch category by slug
  const { data: category, error: catError } = await supabase
    .from("categories")
    .select("id, slug, name, name_en, description, icon, color")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (catError || !category) notFound();

  // Step 2: fetch tools in this category using category_id
  const { data: toolsData, error: toolsError } = await supabase
    .from("tools")
    .select(
      `id, slug, name, name_en, tagline, description, website_url, logo_url,
      pricing_type, starting_price, monthly_price, rating_avg, rating_count,
      category:categories(id, name, slug, icon, color)`
    )
    .eq("is_published", true)
    .eq("status", "published")
    .eq("category_id", category.id)
    .order("rating_avg", { ascending: false });

  if (toolsError) {
    console.error("Tools fetch error:", toolsError);
  }

  const tools = (toolsData as unknown as Parameters<typeof ToolGrid>[0]["tools"]) ?? [];

  return (
    <div className="flex flex-col flex-1">
      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-zinc-200 dark:border-zinc-800"
        style={{
          background: `linear-gradient(135deg, ${category.color}10 0%, transparent 50%, ${category.color}10 100%)`,
        }}
      >
        <div className="mx-auto max-w-6xl px-6 py-12">
          <nav className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-violet-600">الرئيسية</Link>
            <span className="mx-2">/</span>
            <Link href="/tools" className="hover:text-violet-600">كل الأدوات</Link>
            <span className="mx-2">/</span>
            <span className="text-zinc-900 dark:text-zinc-100">{category.name}</span>
          </nav>

          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
              style={{ backgroundColor: `${category.color}20` }}
            >
              {categoryEmoji(category.icon)}
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                {category.name}
              </h1>
              {category.name_en && (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {category.name_en}
                </p>
              )}
            </div>
          </div>

          {category.description && (
            <p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              {category.description}
            </p>
          )}

          <p className="mt-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {tools.length} {tools.length === 1 ? "أداة" : "أداة"} في هذه الفئة
          </p>
        </div>
      </section>

      {/* Tools grid */}
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        {tools.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
            <p className="text-lg font-semibold">لا توجد أدوات في هذه الفئة بعد</p>
            <p className="mt-2 text-sm text-zinc-500">عُد لاحقاً أو تصفح فئات أخرى.</p>
            <Link
              href="/tools"
              className="mt-4 inline-block text-sm font-semibold text-violet-600 hover:text-violet-700"
            >
              كل الأدوات ←
            </Link>
          </div>
        ) : (
          <ToolGrid tools={tools} />
        )}
      </section>
    </div>
  );
}
