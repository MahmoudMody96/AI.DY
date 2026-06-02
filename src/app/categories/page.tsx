import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "كل الفئات",
  description: "تصفح كل فئات أدوات الذكاء الاصطناعي: مساعدين، كتابة، صور، برمجة، فيديو، صوت، أتمتة، وبحث.",
  alternates: { canonical: "/categories" },
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
      <section className="border-b border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <nav className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-violet-600">الرئيسية</Link>
            <span className="mx-2">/</span>
            <span className="text-zinc-900 dark:text-zinc-100">كل الفئات</span>
          </nav>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            كل الفئات
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {categories.length} فئات لتنظيم أدوات الذكاء الاصطناعي
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-3xl"
                style={{ backgroundColor: `${cat.color ?? "#7c3aed"}20` }}
              >
                {categoryEmoji(cat.icon)}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  {cat.name}
                </h2>
                {cat.name_en && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {cat.name_en}
                  </p>
                )}
                {cat.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {cat.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
