import Link from "next/link";
import { FileText, Filter, ExternalLink, BookOpen, GitCompare, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmFormSubmit } from "../_components/confirm-form-submit";
import { DeleteButton } from "../_components/delete-button";
import {
  publishPost,
  unpublishPost,
  deletePost,
  setPostStatus,
} from "./actions";
import { getAdminUser } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { LucideIcon } from "lucide-react";

type Params = {
  searchParams: Promise<{
    status?: string;
    type?: string;
  }>;
};

type Post = {
  id: string;
  slug: string;
  title: string;
  type: string;
  status: string;
  target_tools: string[] | null;
  target_categories: string[] | null;
  seo_keywords: string[] | null;
  reading_time_minutes: number | null;
  published_at: string | null;
  updated_at: string;
  created_at: string;
};

const TYPE_META: Record<string, { label: string; icon: LucideIcon }> = {
  blog_post: { label: "Blog Post", icon: BookOpen },
  comparison: { label: "Comparison", icon: GitCompare },
  use_case: { label: "Use Case", icon: Briefcase },
};

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

export default async function AdminPostsPage({ searchParams }: Params) {
  // Defense-in-depth — admin/layout.tsx already does this, but be explicit.
  try {
    await getAdminUser();
  } catch {
    redirect("/?error=admin_required");
  }

  const sp = await searchParams;
  const statusFilter = sp.status ?? "all";
  const typeFilter = sp.type ?? "all";

  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="text-muted-foreground">Supabase client unavailable.</div>
    );
  }

  let query = supabase
    .from("blog_posts")
    .select(
      "id, slug, title, type, status, target_tools, target_categories, seo_keywords, reading_time_minutes, published_at, updated_at, created_at"
    )
    .order("updated_at", { ascending: false })
    .limit(500);

  if (statusFilter !== "all") query = query.eq("status", statusFilter);
  if (typeFilter !== "all") query = query.eq("type", typeFilter);

  const { data: posts, error } = await query;
  const list: Post[] = (posts as Post[] | null) ?? [];

  const { data: allPosts } = await supabase
    .from("blog_posts")
    .select("status, type");
  const counts = (allPosts ?? []).reduce(
    (acc, p) => {
      acc.total = (acc.total ?? 0) + 1;
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const filterHref = (params: Record<string, string>) => {
    const usp = new URLSearchParams();
    if (statusFilter !== "all" && params.status === undefined) usp.set("status", statusFilter);
    if (typeFilter !== "all" && params.type === undefined) usp.set("type", typeFilter);
    Object.entries(params).forEach(([k, v]) => {
      if (v && v !== "all") usp.set(k, v);
    });
    const qs = usp.toString();
    return qs ? `/admin/posts?${qs}` : "/admin/posts";
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Posts</h1>
          <p className="text-sm text-muted-foreground">
            {counts.total ?? 0} total · {counts.published ?? 0} published · {counts.draft ?? 0} drafts · {counts.scheduled ?? 0} scheduled
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/posts?new=1">
            <FileText className="h-4 w-4" />
            New post
          </Link>
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          Error loading posts: {error.message}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          Status:
        </div>
        {[
          { v: "all", l: "All" },
          { v: "draft", l: "Drafts" },
          { v: "scheduled", l: "Scheduled" },
          { v: "published", l: "Published" },
        ].map((f) => (
          <Link
            key={f.v}
            href={filterHref({ status: f.v })}
            className={
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors " +
              (statusFilter === f.v
                ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                : "border-border text-muted-foreground hover:bg-muted")
            }
          >
            {f.l}
          </Link>
        ))}
        <div className="mx-2 h-4 w-px bg-border" />
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          Type:
        </div>
        {[
          { v: "all", l: "All" },
          { v: "blog_post", l: "Blog" },
          { v: "comparison", l: "Comparison" },
          { v: "use_case", l: "Use Case" },
        ].map((f) => (
          <Link
            key={f.v}
            href={filterHref({ type: f.v })}
            className={
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors " +
              (typeFilter === f.v
                ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                : "border-border text-muted-foreground hover:bg-muted")
            }
          >
            {f.l}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Targets</th>
              <th className="px-4 py-2.5">Read</th>
              <th className="px-4 py-2.5">Updated</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
                  No posts match these filters.{" "}
                  Call{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    POST /api/admin/content
                  </code>
                  .
                </td>
              </tr>
            )}
            {list.map((p) => {
              const typeMeta = TYPE_META[p.type] ?? TYPE_META.blog_post;
              const TypeIcon = typeMeta.icon;
              return (
                <tr key={p.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs text-muted-foreground">
                      /blog/{p.slug}
                      {p.status === "published" && (
                        <Link
                          href={`/blog/${p.slug}`}
                          target="_blank"
                          className="ml-2 inline-flex items-center gap-0.5 text-primary hover:underline"
                        >
                          view <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <TypeIcon className="h-3.5 w-3.5" />
                      {typeMeta.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge value={p.status} />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {(p.target_tools ?? []).slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                      {(p.target_categories ?? []).slice(0, 2).map((c) => (
                        <span
                          key={c}
                          className="rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                        >
                          {c}
                        </span>
                      ))}
                      {((p.target_tools ?? []).length === 0 &&
                        (p.target_categories ?? []).length === 0) && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {p.reading_time_minutes ? `${p.reading_time_minutes}m` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{relativeTime(p.updated_at)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      {p.status === "published" ? (
                        <ConfirmFormSubmit
                          formAction={unpublishPost}
                          id={p.id}
                          message="Unpublish this post? It will no longer be visible on /blog."
                          className="text-xs font-medium text-amber-600 hover:text-amber-700 hover:underline"
                        >
                          Unpublish
                        </ConfirmFormSubmit>
                      ) : (
                        <ConfirmFormSubmit
                          formAction={publishPost}
                          id={p.id}
                          message="Publish this post? It will go live on /blog immediately."
                          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                        >
                          Publish
                        </ConfirmFormSubmit>
                      )}
                      {p.status !== "draft" && (
                        <ConfirmFormSubmit
                          formAction={setPostStatus}
                          id={p.id}
                          message="Revert this post to draft?"
                          className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
                        >
                          To draft
                        </ConfirmFormSubmit>
                      )}
                      <DeleteButton
                        formAction={async (fd) => {
                          fd.set("id", p.id);
                          await deletePost(fd);
                        }}
                        message={`Delete "${p.title}"? This cannot be undone.`}
                        className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
                      >
                        Delete
                      </DeleteButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <details className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Content Engine API — quick reference
        </summary>
        <pre className="mt-3 overflow-x-auto rounded-md bg-background p-3 text-xs leading-relaxed">
{`POST /api/admin/content
Headers:  X-API-Key: <ADMIN_API_KEY>   (or Authorization: Bearer <key>)
          Content-Type: application/json
Body:
  {
    "type": "blog_post" | "comparison" | "use_case",
    "title": "string (3-200)",
    "slug": "optional-auto-generated",
    "body": "markdown text",
    "excerpt": "optional",
    "cover_image": "optional url",
    "target_tools": ["chatgpt", "claude", ...],
    "target_categories": ["ai-assistants", ...],
    "seo_keywords": ["ai", "writing", "arabic", ...],
    "status": "draft" | "scheduled" | "published",
    "published_at": "optional ISO datetime"
  }
Response 201: { ok: true, item: { id, slug, status, type, published_at, ... }, reading_time_minutes, links }`}
        </pre>
      </details>
    </div>
  );
}
