import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Plus, Search } from "lucide-react";

type SearchParams = { q?: string; status?: string };

export default async function AdminToolsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q, status } = await searchParams;
  const admin = createAdminClient();

  let tools: Array<{
    id: string;
    name: string;
    name_en: string | null;
    slug: string;
    pricing_type: string;
    is_published: boolean;
    is_featured: boolean;
    rating_avg: number;
    views_count: number;
    category: { name: string; slug: string } | null;
  }> = [];

  if (admin) {
    let query = admin
      .from("tools")
      .select("id, name, name_en, slug, pricing_type, is_published, is_featured, rating_avg, views_count, category:categories(name, slug)")
      .order("updated_at", { ascending: false })
      .limit(200);

    if (q) {
      query = query.or(`name.ilike.%${q}%,name_en.ilike.%${q}%,slug.ilike.%${q}%`);
    }
    if (status === "published") query = query.eq("is_published", true);
    if (status === "draft") query = query.eq("is_published", false);

    const { data } = await query;
    tools = (data as unknown as typeof tools) ?? [];
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tools</h1>
          <p className="text-sm text-zinc-500">{tools.length} tool{tools.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/admin/tools/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          New tool
        </Link>
      </div>

      <form className="flex gap-2" action="/admin/tools">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name or slug…"
            className="w-full rounded-md border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-zinc-200 bg-white px-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <option value="">All</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <button
          type="submit"
          className="rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          Filter
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
            <tr>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Category</th>
              <th className="px-4 py-2.5">Pricing</th>
              <th className="px-4 py-2.5">Rating</th>
              <th className="px-4 py-2.5">Views</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {tools.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  No tools found.
                </td>
              </tr>
            )}
            {tools.map((t) => (
              <tr key={t.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                <td className="px-4 py-2.5">
                  <Link
                    href={`/admin/tools/${t.id}/edit`}
                    className="font-medium text-violet-700 hover:underline dark:text-violet-400"
                  >
                    {t.name}
                  </Link>
                  {t.name_en && (
                    <span className="ml-2 text-xs text-zinc-400">{t.name_en}</span>
                  )}
                  <div className="text-xs text-zinc-400">/tools/{t.slug}</div>
                </td>
                <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400">
                  {t.category?.name ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400">
                  {t.pricing_type}
                </td>
                <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400">
                  {Number(t.rating_avg).toFixed(1)}
                </td>
                <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400">
                  {t.views_count.toLocaleString("en-US")}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={
                      t.is_published
                        ? "inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                        : "inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    }
                  >
                    {t.is_published ? "Published" : "Draft"}
                  </span>
                  {t.is_featured && (
                    <span className="ml-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                      Featured
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
