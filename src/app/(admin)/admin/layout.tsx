import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminSidebar } from "./_components/admin-sidebar";
import { AdminTopbar } from "./_components/admin-topbar";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s · AI.DY Admin",
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth: middleware also enforces, but double-check here.
  const supabase = await createClient();
  if (!supabase) redirect("/login");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  let profile: { role: string; display_name: string | null; email: string | null; avatar_url: string | null } | null = null;
  if (admin) {
    const { data } = await admin
      .from("profiles")
      .select("role, display_name, email, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    redirect("/?error=admin_required");
  }

  return (
    <div
      dir="ltr"
      lang="en"
      className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      <AdminSidebar />
      <div className="lg:pl-64">
        <AdminTopbar
          user={{
            email: profile.email ?? user.email ?? "",
            displayName: profile.display_name,
            avatarUrl: profile.avatar_url,
          }}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        <footer className="border-t border-zinc-200 px-4 py-4 text-center text-xs text-zinc-500 dark:border-zinc-800 sm:px-6 lg:px-8">
          <Link href="/" className="hover:text-zinc-700 dark:hover:text-zinc-300">
            ← Back to AI.DY public site
          </Link>
          <span className="mx-3 text-zinc-300 dark:text-zinc-700">·</span>
          <span>AI.DY Admin v0.1</span>
        </footer>
      </div>
    </div>
  );
}
