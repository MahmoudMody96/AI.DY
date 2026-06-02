"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const SORT_OPTIONS = [
  { value: "rating", label: "الأعلى تقييماً" },
  { value: "newest", label: "الأحدث" },
  { value: "popular", label: "الأكثر شعبية" },
  { value: "name", label: "أبجدياً" },
];

export function SortDropdown({ currentSort }: { currentSort: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "rating") params.set("sort", value);
    else params.delete("sort");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="relative">
      <select
        value={currentSort}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 appearance-none rounded-full border border-zinc-300 bg-white px-5 pe-10 text-sm font-medium shadow-sm transition hover:border-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-zinc-400"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}
