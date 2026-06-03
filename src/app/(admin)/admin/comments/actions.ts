"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const admin = await createClient();
  if (!admin) throw new Error("Database client unavailable");
  return admin;
}

export async function setCommentStatus(formData: FormData) {
  const admin = await assertAdmin();
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  if (!id || !status) throw new Error("Missing id or status");

  const { error } = await admin
    .from("post_comments")
    .update({
      status,
      moderated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/comments");
  redirect("/admin/comments?updated=1");
}

export async function deleteComment(formData: FormData) {
  const admin = await assertAdmin();
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing id");

  const { error } = await admin.from("post_comments").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/comments");
  redirect("/admin/comments?deleted=1");
}
