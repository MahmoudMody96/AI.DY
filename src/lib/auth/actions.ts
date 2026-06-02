"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string; success?: string };

export async function signInWithPassword(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!email || !password) {
    return { error: "البريد وكلمة المرور مطلوبين" };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "خطأ في الاتصال بالخادم" };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.message.includes("Invalid login")) {
      return { error: "بريد إلكتروني أو كلمة مرور غير صحيحة" };
    }
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signInWithGoogle(next: string = "/"): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { error: "خطأ في الاتصال بالخادم" };

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) return { error: error.message };
  if (data.url) redirect(data.url);
  return {};
}

export async function signUp(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const next = String(formData.get("next") ?? "/");

  if (!email || !password) {
    return { error: "البريد وكلمة المرور مطلوبين" };
  }
  if (password.length < 6) {
    return { error: "كلمة المرور 6 أحرف على الأقل" };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "خطأ في الاتصال بالخادم" };

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "هذا البريد مسجل بالفعل" };
    }
    return { error: error.message };
  }

  return { success: "تم إنشاء الحساب. افحص بريدك الإلكتروني لتفعيل الحساب." };
}

export async function resetPassword(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "البريد الإلكتروني مطلوب" };

  const supabase = await createClient();
  if (!supabase) return { error: "خطأ في الاتصال بالخادم" };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/account`,
  });

  if (error) return { error: error.message };

  return { success: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك." };
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/");
}
