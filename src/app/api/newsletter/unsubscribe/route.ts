// ============================================
// AI.DY — Newsletter: GET /api/newsletter/unsubscribe
// ============================================
// One-click unsubscribe via the email footer link.
// Sets unsubscribed_at = now() and returns a tiny confirmation page.
//
// Future: support signed tokens for one-click from a non-authed
// email client. For now we accept ?email= in the query string.
// ============================================

import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const HTML_PAGE = (email: string, ok: boolean) => `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <title>إلغاء الاشتراك — AI.DY</title>
    <style>
      body { font-family: 'Cairo', 'Tajawal', sans-serif; background: #f8fafc; padding: 40px; color: #0f172a; }
      .card { max-width: 480px; margin: 40px auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); text-align: center; }
      h1 { margin: 0 0 8px; font-size: 22px; }
      p { color: #64748b; line-height: 1.6; }
      a { display: inline-block; margin-top: 20px; color: #7c3aed; text-decoration: none; font-weight: 600; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${ok ? "✅ تم إلغاء اشتراكك" : "تعذّر إلغاء الاشتراك"}</h1>
      <p>${ok ? `لن نرسل لك أي رسائل بعد الآن على <strong>${email}</strong>.` : "حاول مرة تانية أو تواصل معنا."}</p>
      <a href="/">← العودة لـ AI.DY</a>
    </div>
  </body>
</html>`;

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return new NextResponse(HTML_PAGE("", false), {
      status: 400,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const supabase = await createClient();
  if (!supabase) {
    return new NextResponse(HTML_PAGE(email, false), {
      status: 503,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const { error } = await supabase
    .from("newsletter")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("email", email)
    .is("unsubscribed_at", null);

  if (error) {
    console.error("[newsletter/unsubscribe] error:", error.message);
    return new NextResponse(HTML_PAGE(email, false), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  return new NextResponse(HTML_PAGE(email, true), {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
