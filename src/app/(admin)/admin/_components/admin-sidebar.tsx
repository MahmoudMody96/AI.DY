"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wrench,
  FolderTree,
  FileText,
  Newspaper,
  Users,
  Star,
  MessageCircle,
  KeyRound,
  Settings,
  Megaphone,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  disabled?: boolean;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/tools", label: "Tools", icon: Wrench },
  { href: "/admin/sponsored", label: "Sponsored", icon: Megaphone },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/news", label: "News", icon: Newspaper },
  { href: "/admin/user-posts", label: "User Posts", icon: FileText },
  { href: "/admin/comments", label: "Comments", icon: MessageCircle },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/admin/users", label: "Users", icon: Users, disabled: true },
  { href: "/admin/settings", label: "Settings", icon: Settings, disabled: true },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-zinc-200 bg-white lg:block dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex h-16 items-center border-b border-zinc-200 px-6 dark:border-zinc-800">
        <Link href="/admin" className="flex items-center">
          <Logo size="sm" />
          <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Admin
          </span>
        </Link>
      </div>
      <nav className="flex flex-col gap-0.5 p-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const className = [
            "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            active
              ? "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
              : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
            item.disabled ? "pointer-events-none opacity-50" : "",
          ]
            .filter(Boolean)
            .join(" ");
          if (item.disabled) {
            return (
              <span key={item.href} className={className} title="Coming soon">
                <Icon className="h-4 w-4" />
                {item.label}
                <span className="ml-auto text-[10px] font-normal uppercase tracking-wider text-zinc-400">
                  soon
                </span>
              </span>
            );
          }
          return (
            <Link key={item.href} href={item.href} className={className}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="absolute inset-x-0 bottom-0 border-t border-zinc-200 p-3 dark:border-zinc-800">
        <a
          href="https://ai-dy-six.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View live site
        </a>
      </div>
    </aside>
  );
}
