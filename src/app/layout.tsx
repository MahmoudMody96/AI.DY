import type { Metadata } from "next";
import { Geist, Geist_Mono, Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/layout/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "900"],
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "900"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} ${tajawal.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <SiteHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
