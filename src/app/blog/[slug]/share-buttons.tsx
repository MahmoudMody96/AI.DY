"use client";

import { Twitter, Linkedin, Link2 } from "lucide-react";

interface ShareButtonsProps {
  url: string;
  title: string;
}

/**
 * Client-only share buttons. Lives in a separate file because the blog
 * post page is a Server Component — passing onClick handlers from a
 * server component to a <button> is a Next.js error:
 *   "Event handlers cannot be passed to Client Component props."
 */
export function ShareButtons({ url, title }: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(title);

  const handleCopy = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // Best-effort: clipboard may be blocked by browser policy.
      }
    }
  };

  return (
    <div className="ms-auto flex items-center gap-2">
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-zinc-200 p-2 text-zinc-500 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        aria-label="Share on Twitter"
      >
        <Twitter className="h-4 w-4" />
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-zinc-200 p-2 text-zinc-500 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="h-4 w-4" />
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-full border border-zinc-200 p-2 text-zinc-500 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        aria-label="Copy link"
      >
        <Link2 className="h-4 w-4" />
      </button>
    </div>
  );
}
