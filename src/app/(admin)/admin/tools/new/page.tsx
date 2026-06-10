import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveTool } from "../actions";
import { Label } from "../../_components/form-helpers";

export default async function NewToolPage() {
  const admin = await createClient();
  if (!admin) redirect("/admin/tools");

  const { data: categories } = await admin
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("position");
  const cats = categories ?? [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-muted-foreground">Tools</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">New tool</h1>
      </div>

      <form action={saveTool} className="space-y-6 rounded-lg border border-input bg-background p-6 border-input bg-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label>Name (Arabic) *</Label>
            <input
              name="name"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm border-input bg-card"
            />
          </div>
          <div>
            <Label>Name (English)</Label>
            <input
              name="name_en"
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm border-input bg-card"
            />
          </div>
          <div>
            <Label>Category *</Label>
            <select
              name="category_id"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm border-input bg-card"
            >
              <option value="">Select…</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Tagline</Label>
            <input
              name="tagline"
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm border-input bg-card"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Website URL</Label>
            <input
              name="website_url"
              type="url"
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm border-input bg-card"
            />
          </div>
          <div>
            <Label>Pricing type</Label>
            <select
              name="pricing_type"
              defaultValue="freemium"
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm border-input bg-card"
            >
              <option value="free">Free</option>
              <option value="freemium">Freemium</option>
              <option value="paid">Paid</option>
              <option value="contact">Contact</option>
            </select>
          </div>
          <div>
            <Label>Monthly price (USD)</Label>
            <input
              name="monthly_price"
              type="number"
              step="0.01"
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm border-input bg-card"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <textarea
              name="description"
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm border-input bg-card"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-input pt-4 border-input">
          <button
            type="submit"
            className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Create tool
          </button>
          <a
            href="/admin/tools"
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted border-input bg-card hover:bg-muted"
          >
            Cancel
          </a>
          <label className="ml-auto flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_published"
              className="h-4 w-4 rounded border-input text-violet-600"
            />
            Publish immediately
          </label>
        </div>
      </form>
    </div>
  );
}
