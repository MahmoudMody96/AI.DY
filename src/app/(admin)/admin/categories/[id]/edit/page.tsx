import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveCategory, deleteCategory } from "../../actions";
import { Input, Label } from "../../../_components/form-helpers";
import { DeleteButton } from "../../../_components/delete-button";

export default async function EditCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const admin = await createClient();
  if (!admin) redirect("/admin/categories");

  const isNew = id === "new";
  let cat: Record<string, unknown> | null = null;
  if (!isNew) {
    const { data } = await admin
      .from("categories")
      .select("*")
      .eq("id", id)
      .maybeSingle<Record<string, unknown>>();
    if (!data) notFound();
    cat = data;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/categories" className="text-xs text-zinc-500 hover:text-zinc-700">
            ← Categories
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {isNew ? "New category" : `Edit: ${(cat?.name as string) ?? ""}`}
          </h1>
        </div>
        {saved && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            Saved
          </span>
        )}
      </div>

      <form action={saveCategory} className="space-y-6">
        {cat && cat.id ? <input type="hidden" name="id" value={String(cat.id)} /> : null}

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Basics</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Name (Arabic) *" name="name" required defaultValue={(cat?.name as string) ?? ""} />
            <Input label="Name (English)" name="name_en" defaultValue={(cat?.name_en as string) ?? ""} />
            <Input label="Slug" name="slug" defaultValue={(cat?.slug as string) ?? ""} hint="auto-generated from name if empty" />
            <div>
              <Label>Position</Label>
              <input
                name="position"
                type="number"
                defaultValue={(cat?.position as number | null)?.toString() ?? "0"}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>
            <Input label="Icon (lucide name)" name="icon" defaultValue={(cat?.icon as string) ?? ""} hint="e.g. Bot, PenTool, ImageIcon" />
            <Input label="Color (hex)" name="color" defaultValue={(cat?.color as string) ?? ""} hint="e.g. #7c3aed" />
            <div className="md:col-span-2">
              <Label>Description</Label>
              <textarea
                name="description"
                rows={3}
                defaultValue={(cat?.description as string) ?? ""}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">SEO</h2>
          <div className="grid grid-cols-1 gap-4">
            <Input label="SEO title" name="seo_title" defaultValue={(cat?.seo_title as string) ?? ""} />
            <Input label="SEO description" name="seo_description" defaultValue={(cat?.seo_description as string) ?? ""} />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={(cat?.is_active as boolean) ?? true}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-violet-600"
            />
            <div>
              <div className="text-sm font-medium">Active</div>
              <div className="text-xs text-zinc-500">Visible on the public site</div>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <div className="flex gap-2">
            <button type="submit" className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700">
              {isNew ? "Create" : "Save"}
            </button>
            <Link href="/admin/categories" className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800">
              Cancel
            </Link>
          </div>
          {!isNew && (
            <DeleteButton formAction={deleteCategory} message="Delete this category? This cannot be undone.">
              Delete category
            </DeleteButton>
          )}
        </div>
      </form>
    </div>
  );
}
