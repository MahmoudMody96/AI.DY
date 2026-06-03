"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

async function assertAdmin() {
  const admin = createAdminClient();
  if (!admin) throw new Error("Admin client unavailable");
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

export async function saveCategory(formData: FormData) {
  const admin = await assertAdmin();
  const id = formData.get("id") as string | null;
  const slug = slugify((formData.get("slug") as string) || (formData.get("name") as string));

  const payload = {
    name: formData.get("name") as string,
    name_en: (formData.get("name_en") as string) || null,
    slug,
    description: (formData.get("description") as string) || null,
    icon: (formData.get("icon") as string) || null,
    color: (formData.get("color") as string) || null,
    position: formData.get("position") ? Number(formData.get("position")) : 0,
    is_active: formData.get("is_active") === "on",
    seo_title: (formData.get("seo_title") as string) || null,
    seo_description: (formData.get("seo_description") as string) || null,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await admin.from("categories").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/categories");
    revalidatePath(`/admin/categories/${id}/edit`);
    revalidatePath(`/categories/${slug}`);
    redirect(`/admin/categories/${id}/edit?saved=1`);
  } else {
    const { data, error } = await admin
      .from("categories")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    revalidatePath("/admin/categories");
    if (data?.id) redirect(`/admin/categories/${data.id}/edit?saved=1`);
    redirect("/admin/categories?saved=1");
  }
}

export async function deleteCategory(formData: FormData) {
  const admin = await assertAdmin();
  const id = formData.get("id") as string;
  const { error } = await admin.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/categories");
  redirect("/admin/categories?deleted=1");
}
