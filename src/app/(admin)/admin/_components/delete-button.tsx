"use client";

// Small client component wrapper for destructive delete buttons
// to add a confirm() dialog before the form submission.

import { useState, useTransition } from "react";

export function DeleteButton({
  formAction,
  message = "Delete this? This cannot be undone.",
  className = "text-xs text-red-600 hover:text-red-700",
  children,
}: {
  formAction: (formData: FormData) => Promise<void> | void;
  message?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(message)) return;
        const fd = new FormData();
        startTransition(() => {
          void formAction(fd);
        });
      }}
      className={className}
    >
      {pending ? "Deleting…" : children}
    </button>
  );
}
