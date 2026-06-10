import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Logo } from "@/components/brand/logo";
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
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Logo href="/" size="md" />

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/tools" className="text-sm font-medium text-foreground-soft transition-colors hover:text-primary">
            الأدوات
          </Link>
          <Link href="/categories" className="text-sm font-medium text-foreground-soft transition-colors hover:text-primary">
            الفئات
          </Link>
          <Link href="/use-cases" className="text-sm font-medium text-foreground-soft transition-colors hover:text-primary">
            حالات الاستخدام
          </Link>
          <Link href="/news" className="text-sm font-medium text-foreground-soft transition-colors hover:text-primary">
            الأخبار
          </Link>
          <Link href="/blog" className="text-sm font-medium text-foreground-soft transition-colors hover:text-primary">
            المدونة
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-brand-dark"
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
