// ============================================
// AI.DY — TemplateFormDemo (Client Component)
// ============================================
// A dynamic form built from tool.demo_config.fields. Each field is
// rendered with the appropriate input element (text, textarea,
// select, number). On submit the form POSTs to demo_config.endpoint
// (or `/api/demos/template` as a safe default) and displays the
// result. Phase 1.4 uses a static echo response so the interaction
// is testable; Phase 2.0 will dispatch to the configured provider
// (a writing tool, an email generator, etc.).

"use client";

import * as React from "react";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DemoShell } from "../shared/demo-shell";
import type { TemplateFormDemoConfig, TemplateField, DemoProps } from "../types";

function safeParseConfig(raw: unknown): TemplateFormDemoConfig {
  if (typeof raw === "object" && raw !== null) {
    const c = raw as TemplateFormDemoConfig;
    return {
      title: c.title,
      description: c.description,
      submitLabel: c.submitLabel,
      endpoint: c.endpoint,
      fields: Array.isArray(c.fields) ? c.fields : [],
      greeting: c.greeting,
    };
  }
  return { fields: [] };
}

export function TemplateFormDemo({ tool }: DemoProps) {
  const config = safeParseConfig(tool.demo_config);
  const greeting =
    config.greeting ??
    `املى الفورم وجرّب ${tool.name} يولّدلك نتيجة مخصصة.`;

  if (config.fields.length === 0) {
    return (
      <DemoShell toolName={tool.name} toolColor={tool.color} subtitle="template-form">
        <p className="text-sm text-muted-foreground">
          مفيش fields متعرفة في <code>demo_config.fields</code>. عدّل الـ tool
          في الـ admin.
        </p>
      </DemoShell>
    );
  }

  return (
    <DemoShell
      toolName={tool.name}
      toolColor={tool.color}
      subtitle={config.title ?? "template-form"}
    >
      {config.description && (
        <p className="mb-4 text-sm text-muted-foreground">{config.description}</p>
      )}

      <FormBody tool={tool} config={config} greeting={greeting} />
    </DemoShell>
  );
}

function FormBody({
  tool,
  config,
  greeting,
}: {
  tool: DemoProps["tool"];
  config: TemplateFormDemoConfig;
  greeting: string;
}) {
  const [values, setValues] = React.useState<Record<string, string | number>>(() => {
    const init: Record<string, string | number> = {};
    for (const f of config.fields) {
      init[f.name] = f.type === "number" ? 0 : "";
    }
    return init;
  });
  const [pending, setPending] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function update(name: string, value: string | number) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  function isValid(): boolean {
    return config.fields
      .filter((f) => f.required)
      .every((f) => {
        const v = values[f.name];
        if (f.type === "number") return typeof v === "number" && v !== 0;
        return typeof v === "string" && v.trim().length > 0;
      });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid() || pending) return;
    setPending(true);
    setError(null);
    setResult(null);

    // Phase 1.4: synthesise a result locally so the form is testable.
    // Phase 2.0: POST to config.endpoint ?? /api/demos/template.
    try {
      await new Promise((r) => setTimeout(r, 700));
      const summary = config.fields
        .map((f) => `• ${f.label}: ${values[f.name]}`)
        .join("\n");
      setResult(
        `✅ [تجريبي — ${tool.name}]\n\nاستلمت المدخلات:\n${summary}\n\n` +
          `في Phase 2.0 الـ result ده هيتبعت لـ ${config.endpoint ?? "/api/demos/template"} ` +
          `وهيرجع output حقيقي من الـ provider.`
      );
    } catch (err) {
      console.error("[template-form] submit failed:", err);
      setError("حدث خطأ، حاول مرة أخرى.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        {config.fields.map((field) => (
          <Field
            key={field.name}
            field={field}
            value={values[field.name] ?? (field.type === "number" ? 0 : "")}
            onChange={(v) => update(field.name, v)}
            disabled={pending}
          />
        ))}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={!isValid() || pending}
          className="w-full"
          size="lg"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {pending ? "جاري التوليد…" : (config.submitLabel ?? "توليد")}
        </Button>
      </form>

      {result && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
          <div className="mb-2 flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            <h4 className="text-sm font-bold">النتيجة</h4>
          </div>
          <p
            className="whitespace-pre-wrap text-sm leading-7 text-emerald-900 dark:text-emerald-200"
            style={{ direction: "ltr", textAlign: "left" }}
          >
            {result}
          </p>
        </div>
      )}

      <p className="mt-3 text-[11px] text-muted-foreground">{greeting}</p>
    </>
  );
}

function Field({
  field,
  value,
  onChange,
  disabled,
}: {
  field: TemplateField;
  value: string | number;
  onChange: (v: string | number) => void;
  disabled: boolean;
}) {
  const id = `field-${field.name}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {field.label}
        {field.required && <span className="ml-1 text-red-600">*</span>}
      </Label>

      {field.type === "textarea" ? (
        <textarea
          id={id}
          name={field.name}
          rows={4}
          required={field.required}
          placeholder={field.placeholder}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "flex w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground transition",
            "placeholder:text-muted-foreground",
            "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
      ) : field.type === "select" ? (
        <select
          id={id}
          name={field.name}
          required={field.required}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground transition",
            "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <option value="" disabled>
            {field.placeholder ?? "اختر…"}
          </option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : field.type === "number" ? (
        <Input
          id={id}
          name={field.name}
          type="number"
          required={field.required}
          placeholder={field.placeholder}
          value={Number(value) || 0}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          disabled={disabled}
        />
      ) : (
        <Input
          id={id}
          name={field.name}
          type="text"
          required={field.required}
          placeholder={field.placeholder}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      )}
    </div>
  );
}
