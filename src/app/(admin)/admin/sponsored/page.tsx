// ============================================
// AI.DY — Admin: Sponsored Slots
// ============================================
// Minimal CRUD for `public.sponsored_slots`:
//   - List all slots (active + paused + expired)
//   - Create new (position + tool + date range + status)
//   - Pause/resume (toggle status active ↔ paused)
//   - Delete
//
// No inline edit — owners manage dates and tool selection by
// (re)creating the slot. This is intentionally light: a full
// drag-and-drop rotation scheduler is out of scope for Phase 4.0.
// ============================================

import "server-only";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Plus, Pause, Play, Trash2, Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ToolLogoServer } from "@/components/brand/tool-logo-server";

const POSITION_LABELS: Record<string, string> = {
  homepage_hero: "🏠 Hero الصفحة الرئيسية",
  tools_sidebar: "📂 Sidebar /tools",
  category_top: "📂 Top /categories/[slug]",
};

type SlotRow = {
  id: string;
  position: string;
  tool_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  note: string | null;
  tool: {
    id: string;
    slug: string;
    name: string;
    logo_url: string | null;
  } | null;
};

type ToolOption = {
  id: string;
  slug: string;
  name: string;
  is_published: boolean;
};

async function getSlots(): Promise<SlotRow[]> {
  const admin = await createClient();
  if (!admin) return [];
  const { data } = await admin
    .from("sponsored_slots")
    .select(
      `id, position, tool_id, starts_at, ends_at, status, note,
       tool:tools(id, slug, name, logo_url)`
    )
    .order("created_at", { ascending: false })
    .limit(200);
  return (data as unknown as SlotRow[]) ?? [];
}

async function getToolOptions(): Promise<ToolOption[]> {
  const admin = await createClient();
  if (!admin) return [];
  const { data } = await admin
    .from("tools")
    .select("id, slug, name, is_published")
    .order("name")
    .limit(500);
  return (data as ToolOption[]) ?? [];
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusTone(s: string): "success" | "warning" | "muted" {
  if (s === "active") return "success";
  if (s === "paused") return "warning";
  return "muted";
}

function statusLabel(s: string): string {
  if (s === "active") return "Active";
  if (s === "paused") return "Paused";
  if (s === "expired") return "Expired";
  return s;
}

// --- Server actions ---

async function createSlot(formData: FormData) {
  "use server";
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Service role key not set — cannot mutate sponsored_slots");
  }

  const position = String(formData.get("position") ?? "");
  const toolId = String(formData.get("tool_id") ?? "");
  const startsAt = String(formData.get("starts_at") ?? "");
  const endsAt = String(formData.get("ends_at") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!position || !toolId || !startsAt || !endsAt) {
    throw new Error("position, tool_id, starts_at, ends_at are required");
  }
  if (!["homepage_hero", "tools_sidebar", "category_top"].includes(position)) {
    throw new Error(`Invalid position: ${position}`);
  }

  const { error } = await admin.from("sponsored_slots").insert({
    position,
    tool_id: toolId,
    starts_at: new Date(startsAt).toISOString(),
    ends_at: new Date(endsAt).toISOString(),
    status: "active",
    note,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/sponsored");
  revalidatePath("/");
  revalidatePath("/tools");
  revalidatePath("/categories");
}

async function setStatus(formData: FormData) {
  "use server";
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Service role key not set — cannot mutate sponsored_slots");
  }
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("next") ?? "");
  if (!id || !["active", "paused", "expired"].includes(next)) {
    throw new Error("id and next (active|paused|expired) are required");
  }
  const { error } = await admin
    .from("sponsored_slots")
    .update({ status: next })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/sponsored");
}

async function deleteSlot(formData: FormData) {
  "use server";
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Service role key not set — cannot mutate sponsored_slots");
  }
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id is required");
  const { error } = await admin.from("sponsored_slots").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/sponsored");
}

// --- View ---

export default async function AdminSponsoredPage() {
  const [slots, tools] = await Promise.all([getSlots(), getToolOptions()]);
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const nextWeek = new Date(now.getTime() + 7 * 86_400_000)
    .toISOString()
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Megaphone className="h-5 w-5" />
            Sponsored Slots
          </h1>
          <p className="text-sm text-muted-foreground">
            {slots.length} slot{slots.length !== 1 ? "s" : ""} — pin a tool to
            homepage hero, /tools sidebar, or category top
          </p>
        </div>
      </div>

      {/* Create form */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold">New slot</h2>
        <form action={createSlot} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="position">
              Position
            </label>
            <select
              id="position"
              name="position"
              required
              defaultValue="homepage_hero"
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              {Object.entries(POSITION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 lg:col-span-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="tool_id">
              Tool
            </label>
            <select
              id="tool_id"
              name="tool_id"
              required
              defaultValue=""
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="" disabled>
                Select a tool…
              </option>
              {tools.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.is_published ? "" : "(unpublished)"}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="starts_at">
              Starts
            </label>
            <Input
              id="starts_at"
              name="starts_at"
              type="date"
              required
              defaultValue={today}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="ends_at">
              Ends
            </label>
            <Input
              id="ends_at"
              name="ends_at"
              type="date"
              required
              defaultValue={nextWeek}
              className="h-9"
            />
          </div>
          <div className="space-y-1 sm:col-span-2 lg:col-span-4">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="note">
              Note (optional)
            </label>
            <Input
              id="note"
              name="note"
              placeholder="e.g. Q3 Black Friday campaign"
              className="h-9"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" size="sm" className="w-full">
              <Plus className="h-4 w-4" />
              Create slot
            </Button>
          </div>
        </form>
      </div>

      {/* Slots list */}
      {slots.length === 0 ? (
        <EmptyState
          title="No sponsored slots yet"
          description="Create your first slot above to promote a tool on the homepage hero, the /tools sidebar, or a category top banner."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Tool</th>
                <th className="px-4 py-2.5">Position</th>
                <th className="px-4 py-2.5">Window</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {slots.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 shrink-0 overflow-hidden rounded-md ring-1 ring-border">
                        {s.tool ? (
                          <ToolLogoServer
                            slug={s.tool.slug}
                            name={s.tool.name}
                            size={28}
                            rounded="lg"
                          />
                        ) : (
                          <div className="h-full w-full bg-muted" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {s.tool?.name ?? "—"}
                        </p>
                        {s.tool && (
                          <p className="font-mono text-xs text-muted-foreground">
                            /tools/{s.tool.slug}
                          </p>
                        )}
                      </div>
                    </div>
                    {s.note && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        📝 {s.note}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground/80">
                      {s.position}
                    </code>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {fmtDate(s.starts_at)} → {fmtDate(s.ends_at)}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge
                      value={s.status}
                      tone={statusTone(s.status)}
                      label={statusLabel(s.status)}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1.5">
                      {s.status === "active" ? (
                        <form action={setStatus}>
                          <input type="hidden" name="id" value={s.id} />
                          <input type="hidden" name="next" value="paused" />
                          <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            title="Pause"
                          >
                            <Pause className="h-3.5 w-3.5" />
                          </Button>
                        </form>
                      ) : (
                        <form action={setStatus}>
                          <input type="hidden" name="id" value={s.id} />
                          <input
                            type="hidden"
                            name="next"
                            value={s.status === "paused" ? "active" : "paused"}
                          />
                          <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            title="Resume"
                          >
                            <Play className="h-3.5 w-3.5" />
                          </Button>
                        </form>
                      )}
                      <form action={deleteSlot}>
                        <input type="hidden" name="id" value={s.id} />
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          title="Delete"
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        <Link
          href="/"
          className="font-medium text-primary hover:underline"
          target="_blank"
        >
          View live homepage ↗
        </Link>
        {" "}to see the homepage_hero slot, or any /tools/[slug] page to see the
        tools_sidebar slot.
      </p>
    </div>
  );
}
