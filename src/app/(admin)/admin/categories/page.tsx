import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function AdminCategoriesPage() {
  const admin = await createClient();
  if (!admin) {
    return <div className="text-muted-foreground">Admin client unavailable</div>;
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
          <p className="text-sm text-muted-foreground">{cats.length} categories</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/categories/new/edit">
            <Plus className="h-4 w-4" />
            New category
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">Order</th>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Slug</th>
              <th className="px-4 py-2.5">Icon</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {cats.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No categories.
                </td>
              </tr>
            )}
            {cats.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-muted/50">
                <td className="px-4 py-2.5 text-muted-foreground">{c.position}</td>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/admin/categories/${c.id}/edit`}
                    className="font-medium text-primary hover:underline"
                  >
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">/categories/{c.slug}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{c.icon ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge
                    value={c.is_active ? "active" : "inactive"}
                    label={c.is_active ? "Active" : "Inactive"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
