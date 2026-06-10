import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";

type SearchParams = { q?: string; status?: string };

export default async function AdminToolsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q, status } = await searchParams;
  const admin = await createClient();

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
          <p className="text-sm text-muted-foreground">
            {tools.length} tool{tools.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/tools/new">
            <Plus className="h-4 w-4" />
            New tool
          </Link>
        </Button>
      </div>

      <form className="flex gap-2" action="/admin/tools">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search by name or slug…"
            className="h-9 pl-8"
          />
        </div>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">All</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <Button type="submit" variant="outline" size="sm">
          Filter
        </Button>
      </form>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Category</th>
              <th className="px-4 py-2.5">Pricing</th>
              <th className="px-4 py-2.5">Rating</th>
              <th className="px-4 py-2.5">Views</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tools.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No tools found.
                </td>
              </tr>
            )}
            {tools.map((t) => (
              <tr key={t.id} className="transition-colors hover:bg-muted/50">
                <td className="px-4 py-2.5">
                  <Link
                    href={`/admin/tools/${t.id}/edit`}
                    className="font-medium text-primary hover:underline"
                  >
                    {t.name}
                  </Link>
                  {t.name_en && (
                    <span className="ml-2 text-xs text-muted-foreground">{t.name_en}</span>
                  )}
                  <div className="text-xs text-muted-foreground">/tools/{t.slug}</div>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {t.category?.name ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {t.pricing_type}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {Number(t.rating_avg).toFixed(1)}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {t.views_count.toLocaleString("en-US")}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge
                    value={t.is_published ? "published" : "draft"}
                    label={t.is_published ? "Published" : "Draft"}
                  />
                  {t.is_featured && (
                    <StatusBadge
                      value=""
                      tone="warning"
                      label="Featured"
                      withIcon={false}
                      className="ms-1"
                    />
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
