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
  const action = formData.get("action") as string; // "approve" | "reject" | "delete"
  const status =
    action === "approve" ? "approved" : action === "reject" ? "rejected" : "rejected";

  if (action === "delete") {
    await admin.from("reviews").delete().eq("id", id);
  } else {
    await admin
      .from("reviews")
      .update({
        status,
        moderated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    // Update tool rating_avg when approving
    if (action === "approve") {
      const { data: review } = await admin
        .from("reviews")
        .select("tool_id, rating")
        .eq("id", id)
        .maybeSingle();
      if (review) {
        const { data: allReviews } = await admin
          .from("reviews")
          .select("rating")
          .eq("tool_id", review.tool_id)
          .eq("status", "approved");
        const ratings = (allReviews ?? []).map((r) => r.rating);
        const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
        await admin
          .from("tools")
          .update({
            rating_avg: Number(avg.toFixed(2)),
            rating_count: ratings.length,
            updated_at: new Date().toISOString(),
          })
          .eq("id", review.tool_id);
      }
    }
  }

  revalidatePath("/admin/reviews");
  redirect("/admin/reviews?moderated=1");
}
