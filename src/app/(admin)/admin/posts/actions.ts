"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ============================================
// Admin Posts (blog_posts) — Server Actions
// Defense-in-depth: every action verifies role via getAdminUser().
// RLS is the second line of defense.
// ============================================

export async function setPostStatus(formData: FormData) {
  await getAdminUser();
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase client unavailable");

  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  if (!id || !status) throw new Error("Missing id or status");
  if (!["draft", "scheduled", "published"].includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "published") {
    update.published_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("blog_posts")
    .update(update)
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  const slug = formData.get("slug") as string | null;
  if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
  redirect(`/admin/posts?updated=1`);
}

export async function publishPost(formData: FormData) {
  await getAdminUser();
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase client unavailable");

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing id");

  const { error } = await supabase
    .from("blog_posts")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  redirect(`/admin/posts?published=1`);
}

export async function unpublishPost(formData: FormData) {
  await getAdminUser();
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase client unavailable");

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing id");

  const { error } = await supabase
    .from("blog_posts")
    .update({
      status: "draft",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  redirect(`/admin/posts?unpublished=1`);
}

export async function deletePost(formData: FormData) {
  await getAdminUser();
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase client unavailable");

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing id");

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  redirect(`/admin/posts?deleted=1`);
}
