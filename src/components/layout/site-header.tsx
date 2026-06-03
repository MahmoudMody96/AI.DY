import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserMenu } from "./user-menu";
import { Settings } from "lucide-react";

export async function SiteHeader() {
  const supabase = await createClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  // Check if the user is an admin (to show the Admin link)
  let isAdmin = false;
  if (user) {
    const admin = createAdminClient();
    if (admin) {
      const { data } = await admin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      isAdmin = data?.role === "admin" || data?.role === "super_admin";
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight">
          <span className="gradient-text">AI.DY</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/tools" className="text-sm font-medium text-zinc-700 hover:text-violet-600 dark:text-zinc-300">
            الأدوات
          </Link>
          <Link href="/categories" className="text-sm font-medium text-zinc-700 hover:text-violet-600 dark:text-zinc-300">
            الفئات
          </Link>
          <Link href="/blog" className="text-sm font-medium text-zinc-700 hover:text-violet-600 dark:text-zinc-300">
            المدونة
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400"
            >
              <Settings className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">دخول</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">إنشاء حساب</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
