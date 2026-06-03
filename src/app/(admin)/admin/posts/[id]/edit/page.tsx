import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { savePost, deletePost, publishPost } from "../../actions";
import { Input, Label } from "../../../_components/form-helpers";

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; published?: string }>;
}) {
  const { id } = await params;
  const { saved, published } = await searchParams;
  const admin = createAdminClient();
  if (!admin) redirect("/admin/posts");

  const isNew = id === "new";
  let post: Record<string, unknown> | null = null;
  if (!isNew) {
    const { data } = await admin.from("articles").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    post = data;
  }

  const { data: categories } = await admin
    .from("categories")
    .select("id, name, slug")
    .order("position");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/posts" className="text-xs text-zinc-500 hover:text-zinc-700">
            ← Posts
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {isNew ? "New post" : `Edit: ${(post?.title as string) ?? ""}`}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              Saved
            </span>
          )}
          {published && (
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
              Published
            </span>
          )}
        </div>
      </div>

      <form action={savePost} className="space-y-6">
        {post && post.id ? <input type="hidden" name="id" value={String(post.id)} /> : null}

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Content</h2>
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Title *"
              name="title"
              required
              defaultValue={(post?.title as string) ?? ""}
            />
            <Input
              label="Slug"
              name="slug"
              defaultValue={(post?.slug as string) ?? ""}
              hint="auto-generated from title if empty"
            />
            <div>
              <Label>Excerpt</Label>
              <textarea
                name="excerpt"
                rows={2}
                defaultValue={(post?.excerpt as string) ?? ""}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>
            <div>
              <Label>Body (Markdown / MDX)</Label>
              <textarea
                name="content_mdx"
                rows={20}
                defaultValue={(post?.content_mdx as string) ?? ""}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 font-mono text-xs dark:border-zinc-800 dark:bg-zinc-900"
                placeholder="# Title&#10;&#10;Write your post in **markdown**..."
              />
              <p className="mt-1 text-xs text-zinc-500">
                MDX is rendered server-side at build time. Standard markdown + React components.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Metadata
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Category (optional)</Label>
              <select
                name="category_id"
                defaultValue={(post?.category_id as string) ?? ""}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <option value="">— None —</option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Tags (comma separated)"
              name="tags"
              defaultValue={((post?.tags as string[]) ?? []).join(", ")}
              hint="e.g. chatgpt, comparison, arabic"
            />
            <Input
              label="Cover image URL"
              name="cover_url"
              type="url"
              defaultValue={(post?.cover_url as string) ?? ""}
            />
            <Input
              label="Reading time (min)"
              name="reading_time_override"
              type="number"
              defaultValue={(post?.reading_time as number | null)?.toString() ?? ""}
              hint="Leave empty to auto-calculate from body"
            />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">SEO</h2>
          <div className="grid grid-cols-1 gap-4">
            <Input label="Meta title" name="meta_title" defaultValue={(post?.meta_title as string) ?? ""} />
            <Input
              label="Meta description"
              name="meta_description"
              defaultValue={(post?.meta_description as string) ?? ""}
            />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Status
          </h2>
          <div className="space-y-2">
            <div>
              <Label>Status</Label>
              <select
                name="status"
                defaultValue={(post?.status as string) ?? "draft"}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_featured"
                defaultChecked={(post?.is_featured as boolean) ?? false}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-violet-600"
              />
              <div>
                <div className="text-sm font-medium">Featured</div>
                <div className="text-xs text-zinc-500">Highlight on the blog index</div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <div className="flex gap-2">
            <button type="submit" className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700">
              {isNew ? "Create" : "Save"}
            </button>
            {!isNew && (post?.status as string) !== "published" && (
              <button
                type="submit"
                formAction={publishPost}
                className="rounded-md border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50 dark:border-violet-900 dark:bg-zinc-900 dark:text-violet-300 dark:hover:bg-violet-950/30"
              >
                Save & Publish
              </button>
            )}
            <Link href="/admin/posts" className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800">
              Cancel
            </Link>
          </div>
          {!isNew && (
            <button
              type="submit"
              formAction={deletePost}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Delete post
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
