import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { KeyRound, CheckCircle2, X, ExternalLink, AlertTriangle } from "lucide-react";
import { createApiKey, revokeApiKey, reactivateApiKey, deleteApiKey } from "./actions";
import { DeleteKeyButton } from "./delete-key-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";

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

interface SearchParams {
  created?: string;
  revoked?: string;
  reactivated?: string;
  deleted?: string;
}

export default async function AdminApiKeysPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { created, revoked, reactivated, deleted } = await searchParams;
  const admin = await createClient();
  if (!admin) return <div className="text-muted-foreground">Admin client unavailable</div>;

  const { data: keys } = await admin
    .from("api_keys")
    .select("id, name, key_prefix, scopes, last_used_at, expires_at, is_active, created_at")
    .order("created_at", { ascending: false });
  const list = keys ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
        <p className="text-sm text-muted-foreground">
          Manage programmatic access tokens for the AI.DY content API.
        </p>
      </div>

      {/* Success / error banners */}
      {created && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            API key created — copy it now, you won't see it again
          </div>
          <code className="block break-all rounded bg-card px-3 py-2 font-mono text-xs text-foreground">
            {created}
          </code>
          <p className="mt-2 text-xs text-muted-foreground">
            Use this as <code className="rounded bg-muted px-1">X-API-Key</code> header or
            <code className="rounded bg-muted px-1">Authorization: Bearer &lt;key&gt;</code>.
          </p>
        </div>
      )}
      {revoked && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          Key revoked
        </div>
      )}
      {reactivated && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          Key reactivated
        </div>
      )}
      {deleted && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground">
          Key deleted
        </div>
      )}

      {/* Endpoint reference */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Content API
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Use your API key to publish news articles or user posts programmatically (e.g. from AI agents / automation).
        </p>
        <div className="space-y-2 font-mono text-xs">
          <div className="rounded-md border border-border bg-muted px-3 py-2">
            <span className="text-emerald-600 dark:text-emerald-400">POST</span> /api/admin/content
            <span className="ms-2 text-muted-foreground">— create news article or user post (kind: "news" | "user_post")</span>
          </div>
          <div className="rounded-md border border-border bg-muted px-3 py-2">
            <span className="text-blue-600 dark:text-blue-400">GET</span> /api/admin/content
            <span className="ms-2 text-muted-foreground">— list recent items</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Auth via header: <code className="rounded bg-muted px-1">X-API-Key: &lt;key&gt;</code>
        </p>
      </div>

      {/* Create new key */}
      <form
        action={createApiKey}
        className="flex items-end gap-2 rounded-lg border border-border bg-card p-4"
      >
        <div className="flex-1">
          <label
            htmlFor="name"
            className="mb-1 block text-xs font-medium text-foreground"
          >
            New key name
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. AI Agent — Daily Publishing"
            className="h-9"
          />
        </div>
        <Button type="submit" size="sm">
          <KeyRound className="h-4 w-4" />
          Create
        </Button>
      </form>

      {/* Keys list */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Prefix</th>
              <th className="px-4 py-2.5">Scopes</th>
              <th className="px-4 py-2.5">Last used</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Created</th>
              <th className="px-4 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  <KeyRound className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
                  No API keys yet. Create one above.
                </td>
              </tr>
            )}
            {list.map((k) => (
              <tr key={k.id} className="transition-colors hover:bg-muted/50">
                <td className="px-4 py-2.5 font-medium">{k.name}</td>
                <td className="px-4 py-2.5">
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    {k.key_prefix}…
                  </code>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {(k.scopes ?? []).map((s: string) => (
                      <span
                        key={s}
                        className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {relativeTime(k.last_used_at)}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge
                    value={k.is_active ? "active" : "revoked"}
                    label={k.is_active ? "active" : "revoked"}
                  />
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {relativeTime(k.created_at)}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    {k.is_active ? (
                      <form action={revokeApiKey}>
                        <input type="hidden" name="id" value={k.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          className="border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
                        >
                          <X className="h-3 w-3" />
                          Revoke
                        </Button>
                      </form>
                    ) : (
                      <form action={reactivateApiKey}>
                        <input type="hidden" name="id" value={k.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          className="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Reactivate
                        </Button>
                      </form>
                    )}
                    <DeleteKeyButton formAction={deleteApiKey} id={k.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        <p className="font-semibold">⚠ Security note</p>
        <p className="mt-1">
          API keys grant programmatic access to publish content on behalf of your account.
          Store them in a secrets manager (1Password, environment variables) — never commit them
          to git. The key prefix is shown for identification; the full key is only visible
          immediately after creation.
        </p>
      </div>
    </div>
  );
}
