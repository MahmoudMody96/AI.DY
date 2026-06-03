"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const admin = await createClient();
  if (!admin) throw new Error("Database client unavailable");
  return admin;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

function readingTimeFromMarkdown(md: string): number {
  // ~200 words per minute; treat each whitespace-separated token as a word
  const words = md.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export async function savePost(formData: FormData) {
  const admin = await assertAdmin();
  const id = formData.get("id") as string | null;
  const title = formData.get("title") as string;
  const slug = slugify((formData.get("slug") as string) || title);
  const contentMdx = (formData.get("content_mdx") as string) || "";
  const status = (formData.get("status") as string) || "draft";
  const excerpt = (formData.get("excerpt") as string) || null;
  const tagsRaw = (formData.get("tags") as string) || "";
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const categoryId = (formData.get("category_id") as string) || null;
  const metaTitle = (formData.get("meta_title") as string) || null;
  const metaDescription = (formData.get("meta_description") as string) || null;
  const coverUrl = (formData.get("cover_url") as string) || null;
  const isFeatured = formData.get("is_featured") === "on";

  // Ensure unique slug
  let finalSlug = slug;
  let suffix = 1;
  while (true) {
    const { data } = await admin.from("articles").select("id").eq("slug", finalSlug).maybeSingle();
    if (!data || data.id === id) break;
    finalSlug = `${slug}-${++suffix}`;
    if (suffix > 50) throw new Error("Could not generate unique slug");
  }

  const payload: Record<string, unknown> = {
    slug: finalSlug,
    title,
    excerpt,
    content_mdx: contentMdx,
    cover_url: coverUrl,
    category_id: categoryId,
    tags,
    reading_time: readingTimeFromMarkdown(contentMdx),
    is_featured: isFeatured,
    status,
    meta_title: metaTitle,
    meta_description: metaDescription,
    updated_at: new Date().toISOString(),
  };

  if (status === "published" && !formData.get("published_at")) {
    payload.published_at = new Date().toISOString();
  }

  if (id) {
    const { error } = await admin.from("articles").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/posts");
    revalidatePath(`/admin/posts/${id}/edit`);
    revalidatePath("/blog");
    revalidatePath(`/blog/${finalSlug}`);
    revalidatePath("/sitemap.xml");
    redirect(`/admin/posts/${id}/edit?saved=1`);
  } else {
    const { data, error } = await admin
      .from("articles")
      .insert({ ...payload, views_count: 0, likes_count: 0 })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    revalidatePath("/admin/posts");
    if (data?.id) redirect(`/admin/posts/${data.id}/edit?saved=1`);
    redirect("/admin/posts?saved=1");
  }
}

export async function deletePost(formData: FormData) {
  const admin = await assertAdmin();
  const id = formData.get("id") as string;
  const { error } = await admin.from("articles").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/posts");
  redirect("/admin/posts?deleted=1");
}

export async function publishPost(formData: FormData) {
  const admin = await assertAdmin();
  const id = formData.get("id") as string;
  const { error } = await admin
    .from("articles")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/posts");
  revalidatePath(`/admin/posts/${id}/edit`);
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  redirect(`/admin/posts/${id}/edit?published=1`);
}
