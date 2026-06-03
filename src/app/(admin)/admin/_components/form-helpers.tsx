// Reusable form primitives for the admin section
export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
      {children}
    </label>
  );
}

export function Input({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  step,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  step?: string;
  hint?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        name={name}
        required={required}
        defaultValue={defaultValue}
        step={step}
        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900"
      />
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
