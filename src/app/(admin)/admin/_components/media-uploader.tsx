"use client";

import { useState, useRef, useTransition } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { uploadMedia, deleteMedia } from "../_actions/upload";
import { cn } from "@/lib/utils";

export function MediaUploader({
  value,
  onChange,
  folder = "misc",
  className,
  hint,
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  className?: string;
  hint?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleFile = (file: File) => {
    setError(null);
    // Local preview while uploading
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);

    startTransition(async () => {
      const res = await uploadMedia(fd);
      URL.revokeObjectURL(localUrl);
      setPreview(null);
      if (res.ok) {
        onChange(res.url);
      } else {
        setError(res.error);
      }
    });
  };

  const handleRemove = () => {
    if (!value) return;
    if (!confirm("حذف هذه الصورة من التخزين؟")) {
      onChange("");
      return;
    }
    const fd = new FormData();
    fd.append("url", value);
    startTransition(async () => {
      const res = await deleteMedia(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onChange("");
    });
  };

  return (
    <div className={cn("space-y-2", className)}>
      {value || preview ? (
        <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview || value}
            alt=""
            className="block max-h-48 w-full object-contain"
          />
          {pending && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-zinc-950/80">
              <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
            </div>
          )}
          {value && !pending && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-zinc-700 shadow-sm transition hover:bg-white hover:text-red-600 dark:bg-zinc-900/90 dark:text-zinc-300"
              aria-label="Remove"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={pending}
          className="group flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 px-4 py-8 text-sm text-zinc-500 transition hover:border-violet-400 hover:bg-violet-50/50 hover:text-violet-700 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:border-violet-700 dark:hover:bg-violet-950/20"
        >
          {pending ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Upload className="h-6 w-6 transition group-hover:-translate-y-0.5" />
          )}
          <span className="font-medium">
            {pending ? "جاري الرفع…" : "اضغط لرفع صورة"}
          </span>
          <span className="text-xs text-zinc-400">
            PNG, JPG, WebP, GIF, SVG · حتى 5 MB
          </span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />

      {hint && !error && (
        <p className="text-xs text-zinc-500">{hint}</p>
      )}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-600">
          <X className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
