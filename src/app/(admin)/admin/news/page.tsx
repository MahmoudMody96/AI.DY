import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return d.toLocaleDateString();
}

export default async function AdminNewsPage() {
  const admin = await createClient();
  if (!admin) return <div className="text-muted-foreground">Admin client unavailable</div>;

  const { data: posts } = await admin
    .from("articles")
    .select("id, title, slug, status, tags, reading_time, published_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);
  const list = posts ?? [];

  const counts = list.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">News</h1>
          <p className="text-sm text-muted-foreground">
            {list.length} total · {counts.published ?? 0} published · {counts.draft ?? 0} drafts
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/news/new/edit">
            <Plus className="h-4 w-4" />
            New article
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Tags</th>
              <th className="px-4 py-2.5">Read</th>
              <th className="px-4 py-2.5">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  <Newspaper className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
                  No articles yet.{" "}
                  <Link
                    href="/admin/news/new/edit"
                    className="text-primary hover:underline"
                  >
                    Write the first one
                  </Link>
                </td>
              </tr>
            )}
            {list.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-muted/50">
                <td className="px-4 py-2.5">
                  <Link
                    href={`/admin/news/${p.id}/edit`}
                    className="font-medium text-primary hover:underline"
                  >
                    {p.title}
                  </Link>
                  <div className="text-xs text-muted-foreground">/news/{p.slug}</div>
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge value={p.status} />
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {p.tags.slice(0, 3).map((t: string) => (
                      <span
                        key={t}
                        className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {p.reading_time ? `${p.reading_time}m` : "—"}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{relativeTime(p.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
