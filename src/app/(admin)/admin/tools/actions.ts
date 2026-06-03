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
    .slice(0, 80);
}

export async function saveTool(formData: FormData) {
  const admin = await assertAdmin();
  const id = formData.get("id") as string | null;
  const slug = slugify((formData.get("slug") as string) || (formData.get("name") as string));

  const payload = {
    name: formData.get("name") as string,
    name_en: (formData.get("name_en") as string) || null,
    slug,
    tagline: (formData.get("tagline") as string) || null,
    description: (formData.get("description") as string) || null,
    website_url: (formData.get("website_url") as string) || null,
    logo_url: (formData.get("logo_url") as string) || null,
    category_id: formData.get("category_id") as string,
    pricing_type: formData.get("pricing_type") as string,
    starting_price: formData.get("starting_price") ? Number(formData.get("starting_price")) : null,
    monthly_price: formData.get("monthly_price") ? Number(formData.get("monthly_price")) : null,
    is_published: formData.get("is_published") === "on",
    is_featured: formData.get("is_featured") === "on",
    meta_title: (formData.get("meta_title") as string) || null,
    meta_description: (formData.get("meta_description") as string) || null,
    status: (formData.get("is_published") === "on" ? "published" : "draft") as "published" | "draft",
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await admin.from("tools").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/tools");
    revalidatePath(`/admin/tools/${id}/edit`);
    revalidatePath(`/tools/${slug}`);
    redirect(`/admin/tools/${id}/edit?saved=1`);
  } else {
    const { data, error } = await admin
      .from("tools")
      .insert({ ...payload, views_count: 0, clicks_count: 0, rating_count: 0 })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    revalidatePath("/admin/tools");
    if (data?.id) redirect(`/admin/tools/${data.id}/edit?saved=1`);
    redirect("/admin/tools?saved=1");
  }
}

export async function deleteTool(formData: FormData) {
  const admin = await assertAdmin();
  const id = formData.get("id") as string;
  const { error } = await admin.from("tools").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/tools");
  redirect("/admin/tools?deleted=1");
}
