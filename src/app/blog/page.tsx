import Link from "next/link";

export const metadata = {
  title: "المدونة",
  description: "مقالات ونصائح عن أدوات الذكاء الاصطناعي وكيفية استخدامها في عملك وحياتك اليومية.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <div className="flex flex-col flex-1">
      <section className="border-b border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <nav className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-violet-600">الرئيسية</Link>
            <span className="mx-2">/</span>
            <span className="text-zinc-900 dark:text-zinc-100">المدونة</span>
          </nav>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">المدونة</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            قريباً — مقالات ونصائح عن أدوات الذكاء الاصطناعي
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-lg font-semibold">قيد البناء 🚧</p>
          <p className="mt-2 text-sm text-zinc-500">
            بنحضّر محتوى قوي — مقالات، مراجعات تفصيلية، ومقارنات. ارجع قريباً.
          </p>
          <Link
            href="/tools"
            className="mt-6 inline-block text-sm font-semibold text-violet-600 hover:text-violet-700"
          >
            استكشف الأدوات في الأثناء ←
          </Link>
        </div>
      </section>
    </div>
  );
}
