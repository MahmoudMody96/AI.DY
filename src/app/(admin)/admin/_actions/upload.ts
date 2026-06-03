"use server";

// ============================================
// AI.DY — Admin file upload server action
// Uploads a file to Supabase Storage (bucket: "media")
// and returns the public URL. Requires an admin session.
// ============================================

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

function safeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function uploadMedia(formData: FormData): Promise<
  { ok: true; url: string } | { ok: false; error: string }
> {
  const file = formData.get("file");
  const folder = (formData.get("folder") as string) || "misc";

  if (!(file instanceof File)) {
    return { ok: false, error: "No file provided" };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: `Unsupported file type: ${file.type}` };
  }
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      error: `File too large (max ${MAX_BYTES / 1024 / 1024} MB, got ${(file.size / 1024 / 1024).toFixed(1)} MB)`,
    };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, error: "Database client unavailable" };
  }

  // Verify the caller is signed in and is an admin (defense in depth)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string }>();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return { ok: false, error: "Admin role required" };
  }

  // Build a unique path: <folder>/<timestamp>-<safe-name>
  const ts = Date.now();
  const cleanedFolder = folder.replace(/[^a-z0-9/-]+/gi, "").replace(/^\/+|\/+$/g, "") || "misc";
  const objectPath = `${cleanedFolder}/${ts}-${safeName(file.name)}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(objectPath, buffer, {
      contentType: file.type,
      cacheControl: "31536000, immutable", // 1 year cache for hashed uploads
      upsert: false,
    });

  if (uploadError) {
    return { ok: false, error: `Upload failed: ${uploadError.message}` };
  }

  const { data: pub } = supabase.storage.from("media").getPublicUrl(objectPath);
  const url = pub.publicUrl;

  revalidatePath("/admin");
  revalidatePath("/admin/tools");
  revalidatePath("/admin/posts");

  return { ok: true, url };
}

export async function deleteMedia(formData: FormData): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const url = formData.get("url") as string | null;
  if (!url) return { ok: false, error: "No URL" };

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Database client unavailable" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string }>();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return { ok: false, error: "Admin role required" };
  }

  // Extract the object path from the public URL
  // Format: https://<host>/storage/v1/object/public/media/<path>
  const marker = "/storage/v1/object/public/media/";
  const idx = url.indexOf(marker);
  if (idx === -1) return { ok: false, error: "URL is not a media URL" };
  const objectPath = url.slice(idx + marker.length);
  if (objectPath.includes("..")) return { ok: false, error: "Invalid path" };

  const { error } = await supabase.storage.from("media").remove([objectPath]);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
