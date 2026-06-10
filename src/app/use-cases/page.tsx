import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/layout/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { EmptyState } from "@/components/ui/empty-state";
import { UseCaseGrid } from "@/components/use-cases/use-case-grid";

export const metadata: Metadata = {
  title: "حالات الاستخدام",
  description:
    "استكشف أهم حالات استخدام الذكاء الاصطناعي: البرمجة، إنشاء المحتوى، دعم العملاء، تحليل البيانات، والمحتوى العربي. أفضل الأدوات لكل مهمة.",
  keywords: [
    "حالات استخدام AI",
    "استخدامات الذكاء الاصطناعي",
    "أدوات AI للمحتوى",
    "أدوات AI للبرمجة",
    "دعم العملاء AI",
  ],
  alternates: { canonical: "/use-cases" },
  openGraph: {
    title: "حالات استخدام الذكاء الاصطناعي | AI.DY",
    description:
      "أهم سيناريوهات استخدام أدوات الذكاء الاصطناعي — مع أفضل الأدوات لكل مهمة.",
    type: "website",
  },
};

type UseCaseRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string | null;
  related_tool_ids: string[];
};

export default async function UseCasesPage() {
  const supabase = await createClient();

  let useCases: UseCaseRow[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("use_cases")
      .select("id, slug, title, description, icon, related_tool_ids")
      .eq("status", "published")
      .order("created_at", { ascending: true });
    useCases = (data as UseCaseRow[] | null) ?? [];
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-muted/30">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5"
        />
        <Container className="relative py-12">
          <Breadcrumb
            items={[
              { label: "الرئيسية", href: "/" },
              { label: "حالات الاستخدام" },
            ]}
          />
          <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
            ✨ Use Cases
          </p>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            حالات استخدام الذكاء الاصطناعي
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            استكشف أهم السيناريوهات اللي ممكن تستخدم فيها أدوات AI —
            من البرمجة والمحتوى لدعم العملاء والتحليل. كل صفحة فيها
            أفضل الأدوات اللي هنرشّحها للمهمة.
          </p>
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            {useCases.length}{" "}
            {useCases.length === 1 ? "حالة استخدام متاحة" : "حالات استخدام متاحة"}
          </p>
        </Container>
      </section>

      {/* Grid */}
      <section className="py-12">
        <Container>
          {useCases.length === 0 ? (
            <EmptyState
              title="لا توجد حالات استخدام بعد"
              description="ستظهر حالات الاستخدام هنا عند إضافتها."
            />
          ) : (
            <UseCaseGrid useCases={useCases} />
          )}
        </Container>
      </section>
    </div>
  );
}
