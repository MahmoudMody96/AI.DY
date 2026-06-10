// ============================================
// AI.DY — Newsletter: POST /api/newsletter/subscribe
// ============================================
// Body: { email: string, source?: string, name?: string }
//
// Behavior:
//   1) Validate email (Zod)
//   2) Insert into public.newsletter (idempotent — UNIQUE on email,
//      conflict leaves the existing row alone, returns 200 with
//      "already subscribed" hint).
//   3) Fire a welcome email via Resend (graceful failure if
//      RESEND_API_KEY is not set).
//
// Returns:
//   201 — newly inserted
//   200 — already subscribed (idempotent)
//   422 — validation error
//   500 — db error
// ============================================

import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, welcomeEmail } from "@/lib/resend";
import { getPublicEnv } from "@/lib/env";

export const runtime = "nodejs";

const SubscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("بريد إلكتروني غير صالح"),
  name: z.string().trim().max(120).optional(),
  source: z.string().trim().max(64).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 422 }
    );
  }
  const { email, name, source } = parsed.data;

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  // Use service-role client for writes to bypass RLS.
  // Public insert is fine via user client, but service_role makes the
  // API more predictable across envs (e.g. when RLS policies change
  // via future migrations). Falls back to user client if service key
  // is not configured.
  const admin = createAdminClient();
  const writer = admin ?? supabase;

  // Check if already subscribed
  const { data: existing } = await supabase
    .from("newsletter")
    .select("id, is_confirmed, unsubscribed_at")
    .eq("email", email)
    .maybeSingle<{
      id: string;
      is_confirmed: boolean;
      unsubscribed_at: string | null;
    }>();

  if (existing) {
    // Re-subscribe flow: if previously unsubscribed, clear that flag
    if (existing.unsubscribed_at) {
      await writer
        .from("newsletter")
        .update({ unsubscribed_at: null })
        .eq("id", existing.id);
    }
    // Always try to send the welcome email (idempotent UX).
    fireWelcomeEmail(email, name ?? null, source ?? null);
    return NextResponse.json(
      {
        ok: true,
        status: existing.is_confirmed ? "active" : "pending",
        message: "أنت مشترك بالفعل في النشرة",
      },
      { status: 200 }
    );
  }

  // Insert
  const { data: inserted, error } = await writer
    .from("newsletter")
    .insert({
      email,
      name: name ?? null,
      source: source ?? null,
      locale: "ar",
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    const errMsg = (error as { message?: string }).message ?? "Unknown error";
    const errCode = (error as { code?: string }).code;
    console.error("[newsletter/subscribe] insert error:", {
      message: errMsg,
      code: errCode,
    });

    // 23505 = unique_violation on email. The pre-check above should
    // catch this, but in a race the duplicate can still win. Treat it
    // as the same 200 idempotent response.
    if (errCode === "23505") {
      fireWelcomeEmail(email, name ?? null, source ?? null);
      return NextResponse.json(
        {
          ok: true,
          status: "pending",
          message: "أنت مشترك بالفعل في النشرة",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }

  // Fire welcome email (best-effort)
  fireWelcomeEmail(email, name ?? null, source ?? null);

  return NextResponse.json(
    {
      ok: true,
      id: inserted.id,
      status: "pending",
      message: "تم الاشتراك بنجاح — هنبعتلك إيميل ترحيب",
    },
    { status: 201 }
  );
}

/**
 * Fire-and-forget welcome email. We don't await in the request path
 * because a Resend outage shouldn't block subscription. Errors are
 * logged.
 */
function fireWelcomeEmail(
  email: string,
  _name: string | null,
  source: string | null,
) {
  const env = getPublicEnv();
  const { subject, html, text } = welcomeEmail({
    email,
    siteName: env.NEXT_PUBLIC_SITE_NAME,
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
  });
  // Intentionally not awaited
  void sendEmail({ to: email, subject, html, text })
    .then((r) => {
      if (!r.ok && !("skipped" in r && r.skipped)) {
        console.warn(`[newsletter] welcome email failed for ${email}: ${r.error}`);
      } else if (r.ok) {
        console.log(`[newsletter] welcome email sent to ${email} (source=${source ?? "n/a"})`);
      }
    })
    .catch((err) => {
      console.error(`[newsletter] unexpected error sending to ${email}:`, err);
    });
}
