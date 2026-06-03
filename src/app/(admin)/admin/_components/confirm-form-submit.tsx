"use client";

import { ReactNode } from "react";

interface ConfirmFormSubmitProps {
  formAction: (formData: FormData) => Promise<void> | void;
  id: string;
  message: string;
  className?: string;
  children: ReactNode;
}

/**
 * Inline form + button with a confirm() guard. Used in admin list pages
 * where we need a destructive action button with a hidden id and a JS
 * confirmation. Lives in a Client Component because onClick / onSubmit
 * cannot be passed to a button from a Server Component.
 */
export function ConfirmFormSubmit({
  formAction,
  id,
  message,
  className,
  children,
}: ConfirmFormSubmitProps) {
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
