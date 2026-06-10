import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/layout/container";
import { CategoryGrid } from "@/components/categories/category-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "كل الفئات",
  description: "تصفح كل فئات أدوات الذكاء الاصطناعي: مساعدين، كتابة، صور، برمجة، فيديو، صوت، أتمتة، وبحث.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const supabase = await createClient();
  let categories: Array<{
    id: string;
    slug: string;
    name: string;
    name_en: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    position: number | null;
  }> = [];

  if (supabase) {
    const { data } = await supabase
      .from("categories")
      .select("id, slug, name, name_en, description, icon, color, position")
      .eq("is_active", true)
      .order("position", { ascending: true });
    categories = data ?? [];
  }

  return (
    <div className="flex flex-col flex-1">
      <section className="border-b border-border bg-muted/30">
        <Container className="py-10">
          <Breadcrumb
            items={[
              { label: "الرئيسية", href: "/" },
              { label: "كل الفئات" },
            ]}
          />
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            كل الفئات
          </h1>
          <p className="mt-2 text-muted-foreground">
            {categories.length} فئات لتنظيم أدوات الذكاء الاصطناعي
          </p>
        </Container>
      </section>

      <section className="py-12">
        <Container>
          {categories.length > 0 ? (
            <CategoryGrid categories={categories} />
          ) : (
            <EmptyState
              title="لا توجد فئات بعد"
              description="ستظهر الفئات هنا عند إضافتها."
            />
          )}
        </Container>
      </section>
    </div>
  );
}
