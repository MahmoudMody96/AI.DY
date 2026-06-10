// ============================================
// AI.DY — Admin Content API
// Unified endpoint for both editorial (news) and Content Engine (blog_posts).
//
// Discriminator fields:
//   - kind: 'news'         → writes to `articles`
//   - kind: 'user_post'    → writes to `user_posts`
//   - type: 'blog_post' | 'comparison' | 'use_case'  → writes to `blog_posts`
//
// Auth (in order of preference):
//   1. X-API-Key header (uses ADMIN_API_KEY env)
//   2. Authorization: Bearer <key>
//   3. Authenticated admin user session
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ----- Shared helpers -----

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

function readingTimeRound(md: string): number {
  const words = md.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function readingTimeCeil(md: string): number {
  const words = md.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inlineMd(text: string): string {
  // Bold **x**, italic *x* / _x_, code `x`, links [text](url)
  let s = escapeHtml(text);
  // Inline code
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Bold
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Italic
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  s = s.replace(/_([^_]+)_/g, "<em>$1</em>");
  // Links [text](url) — text may already have html; url must be http(s)
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>');
  return s;
}

/**
 * Minimal markdown → HTML renderer for the trusted admin/agent content
 * path. NOT a full CommonMark implementation — supports the subset we use:
 *   - ATX headings (#, ##, ###, ####)
 *   - Paragraphs (blank-line separated)
 *   - Unordered lists (- item, * item)
 *   - Ordered lists (1. item)
 *   - Blockquotes (> text)
 *   - Horizontal rules (---)
 *   - Tables (| col | col |, |---|, | ... |)
 *   - Inline: bold, italic, code, links
 * We do NOT process nested lists or fenced code blocks (rare in our content).
 *
 * The pre-rendered body_html is a cache — the /blog/[slug] page also falls
 * back to client-side ReactMarkdown over body_markdown, so the cache is
 * best-effort. Keeping the renderer dependency-free avoids the
 * react-dom/server build error in Turbopack.
 */
function renderMarkdownToHtml(md: string): string {
  if (!md) return "";
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (!line.trim()) { i++; continue; }

    // Heading
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      out.push(`<h${level}>${inlineMd(h[2])}</h${level}>`);
      i++; continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}\s*$/.test(line)) {
      out.push("<hr/>");
      i++; continue;
    }

    // Table — header line + separator + rows
    if (/^\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\|[-:\s|]+\|\s*$/.test(lines[i + 1])) {
      const headerCells = line.split("|").slice(1, -1).map((c) => c.trim());
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) {
        const cells = lines[i].split("|").slice(1, -1).map((c) => c.trim());
        rows.push(cells);
        i++;
      }
      out.push("<table>");
      out.push("<thead><tr>" + headerCells.map((c) => `<th>${inlineMd(c)}</th>`).join("") + "</tr></thead>");
      out.push("<tbody>" + rows.map((r) => "<tr>" + r.map((c) => `<td>${inlineMd(c)}</td>`).join("") + "</tr>").join("") + "</tbody>");
      out.push("</table>");
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      out.push("<ul>" + items.map((it) => `<li>${inlineMd(it)}</li>`).join("") + "</ul>");
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      out.push("<ol>" + items.map((it) => `<li>${inlineMd(it)}</li>`).join("") + "</ol>");
      continue;
    }

    // Blockquote
    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      out.push(`<blockquote><p>${inlineMd(buf.join(" "))}</p></blockquote>`);
      continue;
    }

    // Paragraph — collect until blank line or block start
    const buf: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|[-*_]{3,}\s*$|\s*[-*]\s|\s*\d+\.\s|\s*>\s?|\|.*\|)/.test(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    out.push(`<p>${inlineMd(buf.join(" "))}</p>`);
  }

  return out.join("\n");
}

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function authenticate(req: NextRequest): Promise<
  { kind: "api_key"; key: string } | { kind: "admin_user" } | null
> {
  // 1) Check API key
  const expected = process.env.ADMIN_API_KEY;
  const provided =
    req.headers.get("x-api-key") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (provided && expected && constantTimeEq(provided, expected)) {
    return { kind: "api_key", key: provided };
  }
  if (provided && !expected) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[api/admin/content] ADMIN_API_KEY not set — endpoint is open in dev");
      return { kind: "api_key", key: provided };
    }
    return null;
  }

  // 2) Check admin user session
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile && (profile.role === "admin" || profile.role === "super_admin")) {
    return { kind: "admin_user" };
  }

  return null;
}

// ----- Validation -----

const ContentSchema = z
  .object({
    // New: Content Engine flow (Phase 1.5)
    type: z
      .enum(["blog_post", "comparison", "use_case"])
      .optional(),

    // Legacy: editorial flow (Phase 1.2-1.4)
    kind: z.enum(["news", "user_post"]).optional(),

    // Shared
    title: z.string().min(3).max(200),
    slug: z
      .string()
      .min(3)
      .max(120)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    excerpt: z.string().max(500).optional(),
    body: z.string().min(10),
    cover_url: z.string().url().optional(),
    cover_image: z.string().url().optional(),
    status: z
      .enum(["draft", "scheduled", "published", "archived"])
      .default("draft"),
    published_at: z.string().datetime().optional().nullable(),

    // Content-Engine specific (blog_post / comparison / use_case)
    target_tools: z.array(z.string()).default([]),
    target_categories: z.array(z.string()).default([]),
    seo_keywords: z.array(z.string()).default([]),

    // News-only (legacy)
    category_slug: z.string().optional(),
    tags: z.array(z.string()).default([]),
    is_featured: z.boolean().default(false),
    meta_title: z.string().max(200).optional(),
    meta_description: z.string().max(500).optional(),

    // User post-only (legacy)
    author_email: z.string().email().optional(),
  })
  .refine(
    (d) => d.type !== undefined || d.kind !== undefined,
    {
      message: "Either `type` (blog_post|comparison|use_case) or `kind` (news|user_post) is required",
      path: ["type"],
    }
  );

// ----- POST -----

export async function POST(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Service unavailable", hint: "SUPABASE_SERVICE_ROLE_KEY not set" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ContentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }
  const input = parsed.data;

  if (input.type) {
    return await handleBlogPost(admin, input);
  }
  if (input.kind) {
    return await handleLegacy(admin, input);
  }

  return NextResponse.json({ error: "No discriminator" }, { status: 400 });
}

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;
type Validated = z.infer<typeof ContentSchema>;

async function handleBlogPost(
  admin: AdminClient,
  input: Validated
): Promise<NextResponse> {
  const type = input.type!;

  let validToolSlugs: string[] = input.target_tools;
  let invalidToolSlugs: string[] = [];
  if (input.target_tools.length > 0) {
    const { data } = await admin
      .from("tools")
      .select("slug")
      .in("slug", input.target_tools);
    const existing = new Set((data ?? []).map((r) => r.slug as string));
    validToolSlugs = input.target_tools.filter((s) => existing.has(s));
    invalidToolSlugs = input.target_tools.filter((s) => !existing.has(s));
  }

  const baseSlug = input.slug ?? slugify(input.title);
  const finalSlug = await ensureUniqueSlug(admin, "blog_posts", baseSlug);
  const bodyHtml = renderMarkdownToHtml(input.body);
  const publishedAt =
    input.status === "published"
      ? input.published_at ?? new Date().toISOString()
      : input.status === "scheduled"
        ? input.published_at ?? null
        : null;

  const { data, error } = await admin
    .from("blog_posts")
    .insert({
      slug: finalSlug,
      title: input.title,
      excerpt: input.excerpt ?? null,
      body_markdown: input.body,
      body_html: bodyHtml,
      cover_image: input.cover_image ?? input.cover_url ?? null,
      type,
      target_tools: validToolSlugs,
      target_categories: input.target_categories,
      seo_keywords: input.seo_keywords,
      reading_time_minutes: readingTimeCeil(input.body),
      status: input.status,
      published_at: publishedAt,
    } as never)
    .select("id, slug, status, type, published_at, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      ok: true,
      item: data,
      table: "blog_posts",
      reading_time_minutes: readingTimeCeil(input.body),
      warnings: invalidToolSlugs.length
        ? { invalid_tool_slugs: invalidToolSlugs }
        : undefined,
      links: {
        public: `/blog/${data.slug}`,
        admin: `/admin/posts`,
      },
    },
    { status: 201 }
  );
}

async function handleLegacy(
  admin: AdminClient,
  input: Validated
): Promise<NextResponse> {
  let categoryId: string | null = null;
  if (input.category_slug) {
    const { data } = await admin
      .from("categories")
      .select("id")
      .eq("slug", input.category_slug)
      .maybeSingle();
    categoryId = data?.id ?? null;
  }

  const baseSlug = input.slug ?? slugify(input.title);
  const table = input.kind === "news" ? "articles" : "user_posts";
  const finalSlug = await ensureUniqueSlug(admin, table, baseSlug);

  if (input.kind === "news") {
    const publishedAt =
      input.status === "published"
        ? input.published_at ?? new Date().toISOString()
        : null;
    const { data, error } = await admin
      .from("articles")
      .insert({
        slug: finalSlug,
        title: input.title,
        excerpt: input.excerpt ?? null,
        content_mdx: input.body,
        cover_url: input.cover_url ?? null,
        category_id: categoryId,
        tags: input.tags,
        reading_time: readingTimeRound(input.body),
        status: input.status === "scheduled" ? "draft" : input.status,
        is_featured: input.is_featured,
        published_at: publishedAt,
        meta_title: input.meta_title ?? null,
        meta_description: input.meta_description ?? null,
      })
      .select("id, slug, status, published_at")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(
      {
        ok: true,
        item: data,
        table: "articles",
        links: { public: `/news/${data.slug}`, admin: `/admin/news/${data.id}/edit` },
      },
      { status: 201 }
    );
  }

  // user_post
  let authorId: string | null = null;
  if (input.author_email) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("email", input.author_email)
      .maybeSingle();
    authorId = data?.id ?? null;
  }
  if (!authorId) {
    return NextResponse.json(
      {
        error:
          "user_post requires author_email (or implement session-based author resolution)",
      },
      { status: 400 }
    );
  }
  const { data, error } = await admin
    .from("user_posts")
    .insert({
      slug: finalSlug,
      title: input.title,
      excerpt: input.excerpt ?? null,
      body: input.body,
      cover_url: input.cover_url ?? null,
      author_id: authorId,
      category_id: categoryId,
      tags: input.tags,
      reading_time: readingTimeRound(input.body),
      status: input.status,
    })
    .select("id, slug, status, published_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(
    {
      ok: true,
      item: data,
      table: "user_posts",
      links: { public: `/blog/${data.slug}`, admin: `/admin/user-posts` },
    },
    { status: 201 }
  );
}

async function ensureUniqueSlug(
  admin: AdminClient,
  table: "blog_posts" | "articles" | "user_posts",
  baseSlug: string
): Promise<string> {
  let finalSlug = baseSlug;
  let suffix = 1;
  while (true) {
    const { data } = await admin
      .from(table)
      .select("id")
      .eq("slug", finalSlug)
      .maybeSingle();
    if (!data) return finalSlug;
    finalSlug = `${baseSlug}-${++suffix}`;
    if (suffix > 50) {
      throw new Error(`Could not generate unique slug for ${table} (base: ${baseSlug})`);
    }
  }
}

// ----- GET (list) -----

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const url = new URL(req.url);
  const kind = (url.searchParams.get("kind") ?? "all") as string;
  const type = (url.searchParams.get("type") ?? "all") as string;
  const status = url.searchParams.get("status");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);

  const out: Record<string, unknown[]> = {
    blog_posts: [],
    articles: [],
    user_posts: [],
  };

  if (type === "all" || ["blog_post", "comparison", "use_case"].includes(type)) {
    let q = admin
      .from("blog_posts")
      .select(
        "id, slug, title, type, status, target_tools, target_categories, published_at, created_at, updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(limit);
    if (status) q = q.eq("status", status);
    if (type !== "all" && ["blog_post", "comparison", "use_case"].includes(type)) {
      q = q.eq("type", type);
    }
    const { data } = await q;
    out.blog_posts = data ?? [];
  }

  if (kind === "all" || kind === "news") {
    const { data } = await admin
      .from("articles")
      .select("id, slug, title, status, published_at, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    out.articles = data ?? [];
  }
  if (kind === "all" || kind === "user_post") {
    const { data } = await admin
      .from("user_posts")
      .select("id, slug, title, status, author_id, published_at, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    out.user_posts = data ?? [];
  }

  return NextResponse.json(out);
}
