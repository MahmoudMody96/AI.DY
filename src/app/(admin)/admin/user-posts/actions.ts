"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const admin = await createClient();
  if (!admin) throw new Error("Database client unavailable");
  return admin;
}

export async function setUserPostStatus(formData: FormData) {
  const admin = await assertAdmin();
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  if (!id || !status) throw new Error("Missing id or status");

  const { error } = await admin
    .from("user_posts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/user-posts");
  revalidatePath("/blog");
  redirect("/admin/user-posts?updated=1");
}

export async function deleteUserPost(formData: FormData) {
  const admin = await assertAdmin();
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing id");

  const { error } = await admin.from("user_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/user-posts");
  revalidatePath("/blog");
  redirect("/admin/user-posts?deleted=1");
}
