"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

async function getAdmin() {
  const admin = await createClient();
  if (!admin) throw new Error("Database client unavailable");
  return admin;
}

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

function generateKey(): string {
  // Format: aidy_<random32chars>
  return "aidy_" + crypto.randomBytes(24).toString("base64url");
}

export async function createApiKey(formData: FormData) {
  const admin = await getAdmin();
  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Name is required");

  // Generate key + hash
  const key = generateKey();
  const keyHash = hashKey(key);
  const keyPrefix = key.slice(0, 12);

  // Get current user as owner
  const { data: { user } } = await admin.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await admin.from("api_keys").insert({
    user_id: user.id,
    name,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    scopes: ["content:write"],
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/api-keys");
  // Pass the raw key via query param so we can show it once
  redirect(`/admin/api-keys?created=${encodeURIComponent(key)}`);
}

export async function revokeApiKey(formData: FormData) {
  const admin = await getAdmin();
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing id");

  const { error } = await admin
    .from("api_keys")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/api-keys");
  redirect("/admin/api-keys?revoked=1");
}

export async function reactivateApiKey(formData: FormData) {
  const admin = await getAdmin();
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing id");

  const { error } = await admin
    .from("api_keys")
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/api-keys");
  redirect("/admin/api-keys?reactivated=1");
}

export async function deleteApiKey(formData: FormData) {
  const admin = await getAdmin();
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing id");

  const { error } = await admin.from("api_keys").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/api-keys");
  redirect("/admin/api-keys?deleted=1");
}
