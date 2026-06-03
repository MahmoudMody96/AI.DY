import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";

export default async function AdminCategoriesPage() {
  const admin = await createClient();
  if (!admin) {
    return <div className="text-zinc-500">Admin client unavailable</div>;
  }
  const { data: categories } = await admin
    .from("categories")
    .select("id, name, slug, is_active, position, icon, color")
    .order("position");
  const cats = categories ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-zinc-500">{cats.length} categories</p>
        </div>
        <Link
          href="/admin/categories/new/edit"
          className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          New category
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
            <tr>
              <th className="px-4 py-2.5">Order</th>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Slug</th>
              <th className="px-4 py-2.5">Icon</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {cats.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  No categories.
                </td>
              </tr>
            )}
            {cats.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                <td className="px-4 py-2.5 text-zinc-500">{c.position}</td>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/admin/categories/${c.id}/edit`}
                    className="font-medium text-violet-700 hover:underline dark:text-violet-400"
                  >
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-zinc-500">/categories/{c.slug}</td>
                <td className="px-4 py-2.5 text-zinc-500">{c.icon ?? "—"}</td>
                <td className="px-4 py-2.5">
                  {c.is_active ? (
                    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      Inactive
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
