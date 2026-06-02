import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-gradient-to-br from-violet-50 via-white to-amber-50 px-6 py-12 dark:from-violet-950/20 dark:via-zinc-950 dark:to-amber-950/20">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center text-2xl font-black tracking-tight">
          <span className="gradient-text">AI.DY</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
