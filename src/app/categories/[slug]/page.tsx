import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ToolGrid } from "../../tools/tool-grid";
import { Container } from "@/components/layout/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { EmptyState } from "@/components/ui/empty-state";
import { SponsoredSlot } from "@/components/marketing/sponsored-slot";
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
        className="relative overflow-hidden border-b border-border"
        style={{
          background: `linear-gradient(135deg, ${category.color}10 0%, transparent 50%, ${category.color}10 100%)`,
        }}
      >
        <Container className="py-12">
          <Breadcrumb
            items={[
              { label: "الرئيسية", href: "/" },
              { label: "كل الأدوات", href: "/tools" },
              { label: category.name },
            ]}
          />

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
                <p className="mt-1 text-sm text-muted-foreground">
                  {category.name_en}
                </p>
              )}
            </div>
          </div>

          {category.description && (
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              {category.description}
            </p>
          )}

          <p className="mt-4 text-sm font-medium text-muted-foreground">
            {tools.length} {tools.length === 1 ? "أداة" : "أداة"} في هذه الفئة
          </p>
        </Container>
      </section>

      {/* Tools grid */}
      <section className="py-12">
        <Container>
          {/* Sponsored slot (top of category page) */}
          <SponsoredSlot
            position="category_top"
            categoryId={category.id}
            className="mb-8"
          />
          {tools.length === 0 ? (
            <EmptyState
              title="لا توجد أدوات في هذه الفئة بعد"
              description="عُد لاحقاً أو تصفح فئات أخرى."
              action={{ label: "كل الأدوات", href: "/tools" }}
            />
          ) : (
            <ToolGrid tools={tools} />
          )}
        </Container>
      </section>
    </div>
  );
}
