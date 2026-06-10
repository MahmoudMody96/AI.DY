import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveTool, deleteTool } from "../../actions";
import { DeleteButton } from "../../../_components/delete-button";
import { LogoUrlField } from "../../../_components/logo-url-field";

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
            className="text-xs text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground"
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

        <div className="rounded-lg border border-input bg-background p-6 border-input bg-card">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
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
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm border-input bg-card"
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
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm border-input bg-card"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <textarea
                name="description"
                rows={4}
                defaultValue={(tool?.description as string) ?? ""}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm border-input bg-card"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-input bg-background p-6 border-input bg-card">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Links &amp; Media
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Website URL" name="website_url" type="url" defaultValue={(tool?.website_url as string) ?? ""} />
            <div>
              <Label>Logo</Label>
              <LogoUrlField
                name="logo_url"
                defaultValue={(tool?.logo_url as string) ?? ""}
                hint="ارفع صورة الشعار مباشرة. PNG, JPG, WebP, SVG. حد أقصى 5 MB."
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-input bg-background p-6 border-input bg-card">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Pricing
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label>Type</Label>
              <select
                name="pricing_type"
                defaultValue={(tool?.pricing_type as string) ?? "freemium"}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm border-input bg-card"
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

        <div className="rounded-lg border border-input bg-background p-6 border-input bg-card">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
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

        <div className="rounded-lg border border-input bg-background p-6 border-input bg-card">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
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

        <div className="flex items-center justify-between border-t border-input pt-4 border-input">
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              {isNew ? "Create" : "Save"}
            </button>
            <Link
              href="/admin/tools"
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted border-input bg-card hover:bg-muted"
            >
              Cancel
            </Link>
          </div>
          {!isNew && (
            <DeleteButton formAction={deleteTool} message="Delete this tool? This cannot be undone.">
              Delete tool
            </DeleteButton>
          )}
        </div>
      </form>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-xs font-medium text-foreground dark:text-muted-foreground">
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
        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm border-input bg-card"
      />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
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
        className="mt-0.5 h-4 w-4 rounded border-input text-violet-600 focus:ring-violet-500"
      />
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
    </label>
  );
}
