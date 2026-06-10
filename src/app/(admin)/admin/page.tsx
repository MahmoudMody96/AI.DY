import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";

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
  flaggedReviews: number;
  draftPosts: number;
}> {
  const admin = await createClient();
  if (!admin) {
    return {
      stats: [],
      recentTools: [],
      recentPosts: [],
      flaggedReviews: 0,
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
    { count: reviewsFlagged },
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
    admin.from("reviews").select("*", { count: "exact", head: true }).neq("status", "published"),
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
      { label: "Reviews (flagged / total)", value: `${reviewsFlagged ?? 0} / ${reviewsTotal ?? 0}`, href: "/admin/reviews" },
      { label: "Users", value: profilesTotal ?? 0 },
      { label: "Leads", value: leadsTotal ?? 0 },
    ],
    recentTools: recentTools ?? [],
    recentPosts: recentPosts ?? [],
    flaggedReviews: reviewsFlagged ?? 0,
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
  const { stats, recentTools, recentPosts, flaggedReviews, draftPosts } = await getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">AI.DY operations overview</p>
      </div>

      {(flaggedReviews > 0 || draftPosts > 0) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-500" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-200">Action required</p>
              <ul className="mt-1 space-y-1 text-amber-800 dark:text-amber-300">
                {flaggedReviews > 0 && (
                  <li>
                    {flaggedReviews} flagged review{flaggedReviews > 1 ? "s" : ""} ·{" "}
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
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            href={s.href}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Recent Tools</h2>
            <Link
              href="/admin/tools"
              className="text-xs text-primary hover:underline"
            >
              View all →
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {recentTools.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                No tools yet
              </li>
            )}
            {recentTools.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/admin/tools/${t.id}/edit`}
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">/tools/{t.slug}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {relativeTime(t.updated_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Recent Posts</h2>
            <Link
              href="/admin/posts"
              className="text-xs text-primary hover:underline"
            >
              View all →
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {recentPosts.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                No posts yet —{" "}
                <Link href="/admin/posts/new" className="text-primary hover:underline">
                  write the first one
                </Link>
              </li>
            )}
            {recentPosts.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/posts/${p.id}/edit`}
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <StatusBadge value={p.status} />
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

      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
        <TrendingUp className="mx-auto h-6 w-6 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold">Analytics coming next</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Plausible integration will land here in Phase 1.6. Track visitors,
          top tools, and conversion to /admin/posts publishes.
        </p>
      </div>
    </div>
  );
}
