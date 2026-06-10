import type { Metadata } from "next";
import { Reem_Kufi, Tajawal, Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

/* ============================================================
   AI.DY — typography
   ------------------------------------------------------------
   Display: Reem Kufi (Arabic) + Fraunces (Latin) — characterful,
            modern Kufi for Arabic, soft serif for Latin
   Body:    Tajawal (Arabic)     + Inter    (Latin) — clean, readable
   ============================================================ */

const reemKufi = Reem_Kufi({
  variable: "--font-reem-kufi",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: "AI.DY — دليلك لأدوات الذكاء الاصطناعي",
    template: "%s | AI.DY",
  },
  description:
    "اكتشف، قارن، واختر أفضل أدوات الذكاء الاصطناعي. مراجعات، أسعار، وبدائل لكل أداة تحتاجها.",
  keywords: [
    "AI tools",
    "أدوات ذكاء اصطناعي",
    "ChatGPT",
    "Claude",
    "Midjourney",
    "مراجعات",
  ],
  alternates: {
    canonical: "/",
    languages: {
      ar: "/",
    },
  },
  openGraph: {
    type: "website",
    siteName: "AI.DY",
    locale: "ar_EG",
    url: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${reemKufi.variable} ${fraunces.variable} ${inter.variable} ${tajawal.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <SiteHeader />
          {children}
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
