"use client";

import Link from "next/link";
import { LogOut, User as UserIcon, Bookmark, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/actions";

export function UserMenu({
  user,
}: {
  user: { email?: string | null; user_metadata?: { full_name?: string; avatar_url?: string } };
}) {
  const fullName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "مستخدم";
  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold text-white transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={fullName} className="h-full w-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[14rem]">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{fullName}</span>
            {user.email && <span className="text-xs text-zinc-500">{user.email}</span>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account" className="flex w-full cursor-pointer items-center gap-2">
            <UserIcon className="h-4 w-4" />
            <span>حسابي</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/saved" className="flex w-full cursor-pointer items-center gap-2">
            <Bookmark className="h-4 w-4" />
            <span>المحفوظات</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/settings" className="flex w-full cursor-pointer items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>الإعدادات</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOut}>
          <DropdownMenuItem asChild>
            <button type="submit" className="flex w-full cursor-pointer items-center gap-2 text-red-600">
              <LogOut className="h-4 w-4" />
              <span>تسجيل الخروج</span>
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
