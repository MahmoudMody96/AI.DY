import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, FileText, CheckCircle2, Clock, Archive } from "lucide-react";

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

export default async function AdminPostsPage() {
  const admin = await createClient();
  if (!admin) return <div className="text-zinc-500">Admin client unavailable</div>;

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
          <h1 className="text-2xl font-semibold tracking-tight">Blog Posts</h1>
          <p className="text-sm text-zinc-500">
            {list.length} total · {counts.published ?? 0} published · {counts.draft ?? 0} drafts
          </p>
        </div>
        <Link
          href="/admin/posts/new/edit"
          className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          New post
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
            <tr>
              <th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Tags</th>
              <th className="px-4 py-2.5">Read</th>
              <th className="px-4 py-2.5">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {list.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                  <FileText className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
                  No posts yet.{" "}
                  <Link
                    href="/admin/posts/new/edit"
                    className="text-violet-600 hover:underline"
                  >
                    Write the first one
                  </Link>
                </td>
              </tr>
            )}
            {list.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                <td className="px-4 py-2.5">
                  <Link
                    href={`/admin/posts/${p.id}/edit`}
                    className="font-medium text-violet-700 hover:underline dark:text-violet-400"
                  >
                    {p.title}
                  </Link>
                  <div className="text-xs text-zinc-400">/blog/{p.slug}</div>
                </td>
                <td className="px-4 py-2.5">
                  {p.status === "published" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" />
                      Published
                    </span>
                  ) : p.status === "draft" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                      <Clock className="h-3 w-3" />
                      Draft
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      <Archive className="h-3 w-3" />
                      {p.status}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {p.tags.slice(0, 3).map((t: string) => (
                      <span
                        key={t}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-zinc-500">
                  {p.reading_time ? `${p.reading_time}m` : "—"}
                </td>
                <td className="px-4 py-2.5 text-zinc-500">{relativeTime(p.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
