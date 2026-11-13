import type { Metadata } from "next";
import { Geist_Mono, Montserrat, Rubik_Dirt } from "next/font/google";
import localFont from "next/font/local";

import { auth } from "@/auth";
import { ChatWidget } from "@/components/chat/chat-widget";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteUrl, siteConfig } from "@/config/site";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const siteUrl = getSiteUrl();

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

/** Rhytmic / Rhythmic Cyrillic — brush display with full Cyrillic. */
const rhythmic = localFont({
  src: "./fonts/Rhythmic-Cyrillic.otf",
  variable: "--font-rhythmic",
  display: "swap",
  weight: "400",
  style: "normal",
});

/** Kept as fallback while comparing display faces. */
const unutterable = localFont({
  src: "./fonts/Unutterable-Italic.otf",
  variable: "--font-unutterable",
  display: "swap",
  weight: "400",
  style: "normal",
});

const rubikDirt = Rubik_Dirt({
  variable: "--font-rubik-dirt",
  weight: "400",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteConfig.brandName} — бронирование квестов`,
    template: `%s — ${siteConfig.brandName}`,
  },
  description:
    "Яркие сценарии и живые эмоции. Бронируйте квесты онлайн: удобные слоты и оплата за 20 минут.",
  applicationName: siteConfig.brandName,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: siteUrl,
    siteName: siteConfig.brandName,
    title: `${siteConfig.brandName} — бронирование квестов`,
    description:
      "Яркие сценарии и живые эмоции. Бронируйте квесты онлайн: удобные слоты и оплата за 20 минут.",
    images: [
      {
        url: "/brand/hero-cabin.jpg",
        width: 1920,
        height: 1080,
        alt: siteConfig.brandName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.brandName} — бронирование квестов`,
    description:
      "Яркие сценарии и живые эмоции. Бронируйте квесты онлайн: удобные слоты и оплата за 20 минут.",
    images: ["/brand/hero-cabin.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    yandex: process.env.YANDEX_VERIFICATION || undefined,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="ru"
      className={`dark ${montserrat.variable} ${rhythmic.variable} ${unutterable.variable} ${rubikDirt.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-black text-foreground">
        <div className="site-chrome-header">
          <SiteHeader />
        </div>
        <div className="relative z-10 flex min-h-0 flex-1 flex-col bg-black">
          <div className="flex-1">{children}</div>
          <div className="site-chrome-footer-slot">
            <Footer />
          </div>
        </div>
        {session?.user?.role === "USER" ? <ChatWidget /> : null}
        <Toaster richColors />
      </body>
    </html>
  );
}
