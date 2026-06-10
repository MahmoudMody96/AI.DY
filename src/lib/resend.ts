// ============================================
// AI.DY — Resend client (lazy, server-only)
// ============================================
// Thin wrapper around the Resend API.
//
// We do NOT add the `resend` npm package — it's a single fetch call,
// and avoiding it keeps the install footprint smaller. If the
// project later needs webhook signing / batch sends / templates,
// swap this for `import { Resend } from "resend"`.
//
// Env: RESEND_API_KEY (required to send), RESEND_FROM_EMAIL (default
// "noreply@ai-dy.com" if unset).
// ============================================

import "server-only";
import { getServerEnv } from "@/lib/env";

export type ResendResult =
  | { ok: true; id: string }
  | { ok: false; error: string; skipped?: boolean };

/**
 * Send a transactional email via Resend.
 * Returns `{ ok: false, skipped: true }` when RESEND_API_KEY is not
 * configured (so callers can degrade gracefully in dev).
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<ResendResult> {
  const env = getServerEnv();
  if (!env.RESEND_API_KEY) {
    console.warn(
      "[resend] RESEND_API_KEY not set — skipping email send. Set it in .env.local to enable welcome emails."
    );
    return { ok: false, error: "RESEND_API_KEY not configured", skipped: true };
  }

  const from = env.RESEND_FROM_EMAIL ?? "noreply@ai-dy.com";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        reply_to: opts.replyTo,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` };
    }

    const json = (await res.json()) as { id?: string };
    if (!json.id) {
      return { ok: false, error: "Resend response missing id" };
    }
    return { ok: true, id: json.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ----------------------------------------------------------------
// HTML helpers — small, inline, no template engine
// ----------------------------------------------------------------

export function welcomeEmail(opts: {
  email: string;
  siteName: string;
  siteUrl: string;
}): { subject: string; html: string; text: string } {
  const { siteName, siteUrl } = opts;
  const subject = `أهلاً بك في ${siteName} — اشتراكك مؤكد ✅`;
  const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <body style="font-family: 'Cairo', 'Tajawal', 'Segoe UI', Tahoma, sans-serif; background: #f8fafc; padding: 24px;">
    <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%); padding: 32px 24px; text-align: center;">
        <h1 style="color: white; font-size: 24px; margin: 0;">أهلاً بك في ${siteName} 👋</h1>
      </div>
      <div style="padding: 28px 24px; color: #0f172a; line-height: 1.7;">
        <p style="font-size: 16px;">شكرًا لاشتراكك في نشرتنا الأسبوعية.</p>
        <p>كل أسبوع بنرسل لك:</p>
        <ul style="padding-right: 20px;">
          <li>أحدث أدوات الـ AI اللي ممكن تغيّر شغلك</li>
          <li>مقارنات سريعة وصراحة في الأسعار</li>
          <li>عروض وخصومات حصرية لشركاء ${siteName}</li>
        </ul>
        <p style="text-align: center; margin: 28px 0 0;">
          <a href="${siteUrl}" style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600;">
            استكشف الأدوات ←
          </a>
        </p>
      </div>
      <div style="padding: 16px 24px; background: #f1f5f9; color: #64748b; font-size: 12px; text-align: center;">
        وصلك هذا الإيميل لأنك اشتركت في ${siteName}. لإلغاء الاشتراك، <a href="${siteUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(opts.email)}" style="color: #64748b;">اضغط هنا</a>.
      </div>
    </div>
  </body>
</html>`.trim();
  const text = `أهلاً بك في ${siteName}! شكرًا لاشتراكك. استكشف الأدوات على ${siteUrl}. لإلغاء الاشتراك: ${siteUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(opts.email)}`;
  return { subject, html, text };
}
