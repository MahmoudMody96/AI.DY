import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CheckCircle2, Flag, Archive, X, Eye, Heart, MessageCircle, Trash2 } from "lucide-react";
import { setUserPostStatus, deleteUserPost } from "./actions";

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

const STATUS_ICON = {
  draft: <Eye className="h-3 w-3" />,
  published: <CheckCircle2 className="h-3 w-3" />,
  flagged: <Flag className="h-3 w-3" />,
  archived: <Archive className="h-3 w-3" />,
  rejected: <X className="h-3 w-3" />,
} as const;

const STATUS_COLOR = {
  draft: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  published: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  flagged: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  archived: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
} as const;

export default async function AdminUserPostsPage() {
  const admin = await createClient();
  if (!admin) return <div className="text-zinc-500">Admin client unavailable</div>;

  const { data: posts } = await admin
    .from("user_posts")
    .select("id, title, slug, status, likes_count, comments_count, published_at, updated_at, author_id")
    .order("updated_at", { ascending: false })
    .limit(200);
  const list = posts ?? [];

  // Get author names
  const authorIds = Array.from(new Set(list.map((p) => p.author_id)));
  const authorMap: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, display_name")
      .in("id", authorIds);
    ((profiles as { id: string; display_name: string | null }[] | null) ?? []).forEach((p) => {
      authorMap[p.id] = p.display_name ?? "—";
    });
  }

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
          <h1 className="text-2xl font-semibold tracking-tight">User Posts</h1>
          <p className="text-sm text-zinc-500">
            {list.length} total · {counts.published ?? 0} published · {counts.flagged ?? 0} flagged · {counts.draft ?? 0} drafts
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
            <tr>
              <th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5">Author</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Stats</th>
              <th className="px-4 py-2.5">Updated</th>
              <th className="px-4 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                  لا توجد مشاركات بعد — الأعضاء يقدروا ينشروا من /blog
                </td>
              </tr>
            )}
            {list.map((p) => {
              const status = p.status as keyof typeof STATUS_ICON;
              return (
                <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/blog/${p.slug}`}
                      target="_blank"
                      className="font-medium text-violet-700 hover:underline dark:text-violet-400"
                    >
                      {p.title}
                    </Link>
                    <div className="text-xs text-zinc-400">/blog/{p.slug}</div>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400">
                    {authorMap[p.author_id] ?? "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[status] ?? STATUS_COLOR.draft}`}
                    >
                      {STATUS_ICON[status] ?? STATUS_ICON.draft}
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-500">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="inline-flex items-center gap-1">
                        <Heart className="h-3 w-3" /> {p.likes_count}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" /> {p.comments_count}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-500">{relativeTime(p.updated_at)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      {p.status !== "published" && (
                        <form action={setUserPostStatus}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="status" value="published" />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Publish
                          </button>
                        </form>
                      )}
                      {p.status !== "flagged" && p.status !== "rejected" && (
                        <form action={setUserPostStatus}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="status" value="flagged" />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
                          >
                            <Flag className="h-3 w-3" />
                            Flag
                          </button>
                        </form>
                      )}
                      {p.status === "flagged" && (
                        <form action={setUserPostStatus}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="status" value="rejected" />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
                          >
                            <X className="h-3 w-3" />
                            Reject
                          </button>
                        </form>
                      )}
                      {p.status !== "archived" && (
                        <form action={setUserPostStatus}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="status" value="archived" />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                          >
                            <Archive className="h-3 w-3" />
                            Archive
                          </button>
                        </form>
                      )}
                      <form action={deleteUserPost}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 rounded border border-rose-200 bg-white px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:bg-zinc-900 dark:text-rose-400 dark:hover:bg-rose-950/30"
                          onClick={(e) => {
                            if (!confirm("Delete this post permanently?")) e.preventDefault();
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
