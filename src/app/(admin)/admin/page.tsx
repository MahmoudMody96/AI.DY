import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Wrench,
  FolderTree,
  FileText,
  Star,
  Users,
  Mail,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from "lucide-react";

type Stat = {
  label: string;
  value: number | string;
  href?: string;
  hint?: string;
  trend?: "up" | "down" | "neutral";
};

async function getStats(): Promise<{
  stats: Stat[];
  recentTools: Array<{ id: string; name: string; slug: string; updated_at: string }>;
  recentPosts: Array<{ id: string; title: string; slug: string; status: string; published_at: string | null; updated_at: string }>;
  pendingReviews: number;
  draftPosts: number;
}> {
  const admin = await createClient();
  if (!admin) {
    return {
      stats: [],
      recentTools: [],
      recentPosts: [],
      pendingReviews: 0,
      draftPosts: 0,
    };
  }

  const [
    { count: toolsTotal },
    { count: toolsPublished },
    { count: categoriesTotal },
    { count: articlesTotal },
    { count: articlesPublished },
    { count: articlesDraft },
    { count: reviewsTotal },
    { count: reviewsPending },
    { count: profilesTotal },
    { count: leadsTotal },
    { data: recentTools },
    { data: recentPosts },
  ] = await Promise.all([
    admin.from("tools").select("*", { count: "exact", head: true }),
    admin.from("tools").select("*", { count: "exact", head: true }).eq("is_published", true),
    admin.from("categories").select("*", { count: "exact", head: true }),
    admin.from("articles").select("*", { count: "exact", head: true }),
    admin.from("articles").select("*", { count: "exact", head: true }).eq("status", "published"),
    admin.from("articles").select("*", { count: "exact", head: true }).eq("status", "draft"),
    admin.from("reviews").select("*", { count: "exact", head: true }),
    admin.from("reviews").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("leads").select("*", { count: "exact", head: true }),
    admin
      .from("tools")
      .select("id, name, slug, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5),
    admin
      .from("articles")
      .select("id, title, slug, status, published_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  return {
    stats: [
      { label: "Tools (published / total)", value: `${toolsPublished ?? 0} / ${toolsTotal ?? 0}`, href: "/admin/tools" },
      { label: "Categories", value: categoriesTotal ?? 0, href: "/admin/categories" },
      { label: "Blog Posts (published / draft)", value: `${articlesPublished ?? 0} / ${articlesDraft ?? 0}`, href: "/admin/posts" },
      { label: "Reviews (pending / total)", value: `${reviewsPending ?? 0} / ${reviewsTotal ?? 0}`, href: "/admin/reviews" },
      { label: "Users", value: profilesTotal ?? 0 },
      { label: "Leads", value: leadsTotal ?? 0 },
    ],
    recentTools: recentTools ?? [],
    recentPosts: recentPosts ?? [],
    pendingReviews: reviewsPending ?? 0,
    draftPosts: articlesDraft ?? 0,
  };
}

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

export default async function AdminDashboardPage() {
  const { stats, recentTools, recentPosts, pendingReviews, draftPosts } = await getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-500">AI.DY operations overview</p>
      </div>

      {(pendingReviews > 0 || draftPosts > 0) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-500" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-200">Action required</p>
              <ul className="mt-1 space-y-1 text-amber-800 dark:text-amber-300">
                {pendingReviews > 0 && (
                  <li>
                    {pendingReviews} review{pendingReviews > 1 ? "s" : ""} pending moderation ·{" "}
                    <Link href="/admin/reviews" className="underline">
                      Review now
                    </Link>
                  </li>
                )}
                {draftPosts > 0 && (
                  <li>
                    {draftPosts} draft blog post{draftPosts > 1 ? "s" : ""} ·{" "}
                    <Link href="/admin/posts" className="underline">
                      View posts
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href ?? "#"}
            className="group rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{s.label}</p>
              {s.href && (
                <ArrowUpRight className="h-3.5 w-3.5 text-zinc-300 transition-colors group-hover:text-zinc-500 dark:text-zinc-700" />
              )}
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h2 className="text-sm font-semibold">Recent Tools</h2>
            <Link
              href="/admin/tools"
              className="text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400"
            >
              View all →
            </Link>
          </div>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {recentTools.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-zinc-500">No tools yet</li>
            )}
            {recentTools.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/admin/tools/${t.id}/edit`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-zinc-500">/tools/{t.slug}</p>
                  </div>
                  <span className="text-xs text-zinc-400">{relativeTime(t.updated_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h2 className="text-sm font-semibold">Recent Posts</h2>
            <Link
              href="/admin/posts"
              className="text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400"
            >
              View all →
            </Link>
          </div>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {recentPosts.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-zinc-500">
                No posts yet —{" "}
                <Link href="/admin/posts/new" className="text-violet-600 hover:underline">
                  write the first one
                </Link>
              </li>
            )}
            {recentPosts.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/posts/${p.id}/edit`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <p className="flex items-center gap-2 text-xs text-zinc-500">
                      <span
                        className={
                          p.status === "published"
                            ? "inline-flex items-center gap-1 text-emerald-600"
                            : p.status === "draft"
                            ? "inline-flex items-center gap-1 text-amber-600"
                            : "inline-flex items-center gap-1 text-zinc-500"
                        }
                      >
                        {p.status === "published" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {p.status}
                      </span>
                      <span>·</span>
                      <span>{relativeTime(p.published_at ?? p.updated_at)}</span>
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
        <TrendingUp className="mx-auto h-6 w-6 text-zinc-400" />
        <h3 className="mt-2 text-sm font-semibold">Analytics coming next</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Plausible integration will land here in Phase 1.6. Track visitors,
          top tools, and conversion to /admin/posts publishes.
        </p>
      </div>
    </div>
  );
}
