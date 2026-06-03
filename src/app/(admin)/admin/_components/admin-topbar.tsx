"use client";

import { usePathname, useRouter } from "next/navigation";
import { Search, LogOut, ChevronRight } from "lucide-react";
import { useState } from "react";

type User = {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

function titleFromPath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 1) return "Dashboard";
  return parts
    .slice(1)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" / ");
}

function initials(name: string | null | undefined, email: string): string {
  if (name) {
    return name
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return (email[0] ?? "?").toUpperCase();
}

export function AdminTopbar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Sign-out failed:", e);
      setSigningOut(false);
    }
  };

  const title = titleFromPath(pathname);
  const breadcrumbParts = pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-md sm:px-6 lg:px-8 dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="flex flex-1 items-center gap-2 text-sm">
        {breadcrumbParts.map((part, i) => (
          <span key={i} className="flex items-center gap-2 text-zinc-500">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-700" />}
            <span className={i === breadcrumbParts.length - 1 ? "font-semibold text-zinc-900 dark:text-zinc-100" : ""}>
              {part.charAt(0).toUpperCase() + part.slice(1)}
            </span>
          </span>
        ))}
      </div>
      <div className="hidden items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-500 md:flex dark:border-zinc-800 dark:bg-zinc-900">
        <Search className="h-3.5 w-3.5" />
        <span>{title}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.displayName ?? user.email}
              className="h-7 w-7 rounded-full"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {initials(user.displayName, user.email)}
            </div>
          )}
          <div className="hidden text-right text-xs sm:block">
            <div className="font-medium leading-tight">{user.displayName ?? user.email}</div>
            <div className="text-zinc-500">{user.email}</div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
