"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect } from "react";

type Category = {
  id: string;
  slug: string;
  name: string;
  emoji: string;
};

const PRICING_OPTIONS = [
  { value: "", label: "الكل" },
  { value: "free", label: "مجاني" },
  { value: "freemium", label: "مجاني + مدفوع" },
  { value: "paid", label: "مدفوع" },
];

const RATING_OPTIONS = [
  { value: 0, label: "الكل" },
  { value: 3, label: "3+ ⭐" },
  { value: 4, label: "4+ ⭐" },
  { value: 4.5, label: "4.5+ ⭐" },
];

export function FilterSidebar({
  categories,
  currentCategory,
  currentPricing,
  currentMinRating,
}: {
  categories: Category[];
  currentCategory?: string;
  currentPricing?: string;
  currentMinRating: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      // Reset page when filter changes
      if (key !== "page") params.delete("page");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-500">
          الفئة
        </h3>
        <div className="space-y-1.5">
          <button
            onClick={() => updateParam("category", "")}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
              !currentCategory
                ? "bg-violet-50 font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            <span>✨</span>
            <span>كل الفئات</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateParam("category", cat.slug)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                currentCategory === cat.slug
                  ? "bg-violet-50 font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-500">
          التسعير
        </h3>
        <div className="space-y-1.5">
          {PRICING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParam("pricing", opt.value)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                (currentPricing ?? "") === opt.value
                  ? "bg-violet-50 font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <span
                className={`h-3 w-3 rounded-full border-2 ${
                  (currentPricing ?? "") === opt.value
                    ? "border-violet-500 bg-violet-500"
                    : "border-zinc-300 dark:border-zinc-600"
                }`}
              />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-500">
          التقييم الأدنى
        </h3>
        <div className="space-y-1.5">
          {RATING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParam("min_rating", opt.value ? String(opt.value) : "")}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                currentMinRating === opt.value
                  ? "bg-violet-50 font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
