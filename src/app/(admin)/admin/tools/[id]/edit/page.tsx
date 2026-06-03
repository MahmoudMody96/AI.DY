import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveTool, deleteTool } from "../../actions";

const PRICING_TYPES = ["free", "freemium", "paid", "contact"] as const;

export default async function EditToolPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const admin = await createClient();
  if (!admin) redirect("/admin/tools");

  const isNew = id === "new";

  let tool: Record<string, unknown> | null = null;
  let categories: Array<{ id: string; name: string; slug: string }> = [];

  if (!isNew) {
    const { data } = await admin.from("tools").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    tool = data;
  }

  const { data: cats } = await admin
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("position");
  categories = cats ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/tools"
            className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            ← Tools
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {isNew ? "New tool" : `Edit: ${(tool?.name as string) ?? ""}`}
          </h1>
        </div>
        {saved && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            Saved
          </span>
        )}
      </div>

      <form action={saveTool} className="space-y-6">
        {tool && tool.id ? <input type="hidden" name="id" value={String(tool.id)} /> : null}

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Basics
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Name (Arabic)" name="name" required defaultValue={(tool?.name as string) ?? ""} />
            <Field label="Name (English)" name="name_en" defaultValue={(tool?.name_en as string) ?? ""} />
            <Field label="Slug" name="slug" defaultValue={(tool?.slug as string) ?? ""} hint="auto-generated from name if empty" />
            <div>
              <Label>Category</Label>
              <select
                name="category_id"
                required
                defaultValue={(tool?.category_id as string) ?? ""}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <option value="">Select…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label>Tagline</Label>
              <input
                name="tagline"
                defaultValue={(tool?.tagline as string) ?? ""}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <textarea
                name="description"
                rows={4}
                defaultValue={(tool?.description as string) ?? ""}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Links &amp; Media
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Website URL" name="website_url" type="url" defaultValue={(tool?.website_url as string) ?? ""} />
            <Field label="Logo URL" name="logo_url" type="url" defaultValue={(tool?.logo_url as string) ?? ""} />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Pricing
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label>Type</Label>
              <select
                name="pricing_type"
                defaultValue={(tool?.pricing_type as string) ?? "freemium"}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                {PRICING_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <Field
              label="Starting price (USD)"
              name="starting_price"
              type="number"
              step="0.01"
              defaultValue={(tool?.starting_price as number | null)?.toString() ?? ""}
            />
            <Field
              label="Monthly price (USD)"
              name="monthly_price"
              type="number"
              step="0.01"
              defaultValue={(tool?.monthly_price as number | null)?.toString() ?? ""}
            />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            SEO
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Meta title" name="meta_title" defaultValue={(tool?.meta_title as string) ?? ""} />
            <Field
              label="Meta description"
              name="meta_description"
              defaultValue={(tool?.meta_description as string) ?? ""}
            />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Visibility
          </h2>
          <div className="space-y-2">
            <Toggle
              name="is_published"
              label="Published"
              hint="Visible on the public site"
              defaultChecked={(tool?.is_published as boolean) ?? false}
            />
            <Toggle
              name="is_featured"
              label="Featured"
              hint="Shows in the homepage featured row"
              defaultChecked={(tool?.is_featured as boolean) ?? false}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              {isNew ? "Create" : "Save"}
            </button>
            <Link
              href="/admin/tools"
              className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              Cancel
            </Link>
          </div>
          {!isNew && (
            <button
              type="submit"
              formAction={deleteTool}
              className="text-xs text-red-600 hover:text-red-700"
              onClick={(e) => {
                if (!confirm("Delete this tool? This cannot be undone.")) {
                  e.preventDefault();
                }
              }}
            >
              Delete tool
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
      {children}
    </label>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  step,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  step?: string;
  hint?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        name={name}
        required={required}
        defaultValue={defaultValue}
        step={step}
        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900"
      />
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

function Toggle({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
      />
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-zinc-500">{hint}</div>}
      </div>
    </label>
  );
}
