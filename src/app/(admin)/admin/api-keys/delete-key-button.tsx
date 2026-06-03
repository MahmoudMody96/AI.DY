"use client";

import { Trash2 } from "lucide-react";

interface DeleteKeyButtonProps {
  formAction: (formData: FormData) => void;
  id: string;
}

export function DeleteKeyButton({ formAction, id }: DeleteKeyButtonProps) {
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Delete this key permanently? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="inline-flex items-center gap-1 rounded border border-rose-200 bg-white px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:bg-zinc-900 dark:text-rose-400 dark:hover:bg-rose-950/30"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </form>
  );
}
