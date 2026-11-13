import type { Metadata } from "next";
import { Geist_Mono, Montserrat, Rubik_Dirt } from "next/font/google";
import localFont from "next/font/local";

import { auth } from "@/auth";
import { ChatWidget } from "@/components/chat/chat-widget";
import { DetectTelegramBrowser } from "@/components/detect-telegram-browser";
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
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0707" },
    { media: "(prefers-color-scheme: light)", color: "#0a0707" },
  ],
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/brand/nekvest-icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
        url: "/brand/og-share.jpg",
        width: 1200,
        height: 630,
        alt: `${siteConfig.brandName} — бронирование квестов`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.brandName} — бронирование квестов`,
    description:
      "Яркие сценарии и живые эмоции. Бронируйте квесты онлайн: удобные слоты и оплата за 20 минут.",
    images: ["/brand/og-share.jpg"],
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
        <DetectTelegramBrowser />
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
