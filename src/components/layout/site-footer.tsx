// ============================================
// AI.DY — Site Footer
// ============================================
// Global footer with:
//   - Brand + tagline
//   - Quick links
//   - Newsletter signup (form posts to /api/newsletter/subscribe)
//   - LeadGenCta inline variant
//   - Copyright + social
//
// Server component. Includes the NewsletterForm client component.
// ============================================

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Container } from "./container";
import { NewsletterForm } from "@/components/marketing/newsletter-form";
import { LeadGenCta } from "@/components/marketing/lead-gen-cta";
import { Github, Twitter, Linkedin } from "lucide-react";

const QUICK_LINKS: Array<{ label: string; href: string }> = [
  { label: "الأدوات", href: "/tools" },
  { label: "الفئات", href: "/categories" },
  { label: "حالات الاستخدام", href: "/use-cases" },
  { label: "المقارنات", href: "/compare" },
  { label: "الأخبار", href: "/news" },
  { label: "المدونة", href: "/blog" },
];

const RESOURCE_LINKS: Array<{ label: string; href: string }> = [
  { label: "عن AI.DY", href: "/about" },
  { label: "اتصل بنا", href: "/contact" },
  { label: "سياسة الخصوصية", href: "/privacy" },
  { label: "الشروط والأحكام", href: "/terms" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer
      className="mt-auto border-t border-border bg-muted/30"
      data-site-footer
    >
      {/* Newsletter + LeadGen CTA section */}
      <Container className="py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <NewsletterForm source="footer" />
          <LeadGenCta variant="inline" source="footer" />
        </div>
      </Container>

      {/* Links + brand */}
      <div className="border-t border-border">
        <Container className="py-10">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand col */}
            <div className="lg:col-span-1">
              <Logo href="/" size="md" />
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                أكبر منصة Demo-First لأدوات الذكاء الاصطناعي في المنطقة
                العربية. مراجعات حقيقية، أسعار محدّثة، وبدائل مجانية.
              </p>
              <div className="mt-4 flex items-center gap-3 text-muted-foreground">
                <a
                  href="https://twitter.com/aidy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full p-1.5 transition hover:bg-foreground/5 hover:text-foreground"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="https://linkedin.com/company/aidy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full p-1.5 transition hover:bg-foreground/5 hover:text-foreground"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href="https://github.com/aidy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full p-1.5 transition hover:bg-foreground/5 hover:text-foreground"
                  aria-label="GitHub"
                >
                  <Github className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Quick links col */}
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">
                استكشف
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {QUICK_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="transition hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources col */}
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">
                الشركة
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {RESOURCE_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="transition hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Markets col — list a couple of "popular" sub-pages */}
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">
                الأكثر قراءة
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/tools/chatgpt"
                    className="transition hover:text-foreground"
                  >
                    مراجعة ChatGPT
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tools/claude"
                    className="transition hover:text-foreground"
                  >
                    مراجعة Claude
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tools/midjourney"
                    className="transition hover:text-foreground"
                  >
                    مراجعة Midjourney
                  </Link>
                </li>
                <li>
                  <Link
                    href="/use-cases"
                    className="transition hover:text-foreground"
                  >
                    حالات الاستخدام
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-border">
        <Container className="py-4">
          <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
            <p>
              © {year} AI.DY — كل الحقوق محفوظة
            </p>
            <p className="flex items-center gap-2">
              <span>صُنع بـ</span>
              <span className="text-red-500">♥</span>
              <span>في القاهرة</span>
            </p>
          </div>
        </Container>
      </div>
    </footer>
  );
}
