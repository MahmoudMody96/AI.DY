"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const admin = await createClient();
  if (!admin) throw new Error("Database client unavailable");
  return admin;
}

export async function moderateReview(formData: FormData) {
  const admin = await assertAdmin();
  const id = formData.get("id") as string;
  const action = formData.get("action") as string; // "publish" | "delete"

  if (action === "delete") {
    await admin.from("reviews").delete().eq("id", id);
  } else if (action === "publish") {
    await admin
      .from("reviews")
      .update({
        status: "published",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    // The trg_reviews_recalc_rating trigger will recompute rating_avg
    // and rating_count on the parent tool automatically.
  }

  revalidatePath("/admin/reviews");
  redirect("/admin/reviews?moderated=1");
}
