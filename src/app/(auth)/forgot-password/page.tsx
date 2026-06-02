"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/auth/actions";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    setPending(true);
    const result = await resetPassword(formData);
    setPending(false);
    if (result?.error) setError(result.error);
    if (result?.success) setSuccess(result.success);
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-2xl font-black">نسيت كلمة المرور؟</h1>
      <p className="mt-2 text-sm text-zinc-500">أدخل بريدك وسنرسل لك رابط إعادة التعيين.</p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
          {success}
        </div>
      )}

      <form action={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <Button type="submit" size="lg" disabled={pending} className="w-full">
          {pending ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        فاكر كلمة المرور؟{" "}
        <Link href="/login" className="font-semibold text-violet-600 hover:underline">
          سجّل دخول
        </Link>
      </p>
    </div>
  );
}
