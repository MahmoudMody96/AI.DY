"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

/**
 * SearchBar — controlled input with a debounced onSearch callback.
 *
 * This is the *generic* primitive. The /tools page's search-bar uses URL
 * searchParams for routing; admin pages and other features should use this one.
 */
export interface SearchBarProps {
  value: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  /** Debounce of 0 means onSearch fires on every keystroke. */
  className?: string;
  /** Show clear (×) button when value is non-empty. Defaults to true. */
  showClear?: boolean;
}

export function SearchBar({
  value,
  onSearch,
  placeholder = "ابحث…",
  debounceMs = 300,
  className,
  showClear = true,
}: SearchBarProps) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Sync external value → local (e.g. URL change, reset)
  useEffect(() => {
    setLocal(value);
  }, [value]);

  // Debounced emit
  useEffect(() => {
    if (local === value) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch(local);
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, debounceMs]);

  return (
    <div className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-10 w-full rounded-md border border-input bg-surface-elevated pe-10 ps-10 text-sm shadow-warm-sm transition",
          "placeholder:text-muted-foreground",
          "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
        )}
        aria-label="Search"
      />
      {showClear && local && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setLocal("");
            onSearch("");
            inputRef.current?.focus();
          }}
          className="absolute end-9 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
