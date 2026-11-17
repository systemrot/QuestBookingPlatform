import type { Metadata } from "next";
import { Geist_Mono, Montserrat, Rubik_Dirt } from "next/font/google";
import localFont from "next/font/local";

import { auth } from "@/auth";
import { ChatWidget } from "@/components/chat/chat-widget";
import { DetectTelegramBrowser } from "@/components/detect-telegram-browser";
import { Footer } from "@/components/Footer";
import { OrganizationJsonLd } from "@/components/organization-json-ld";
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
  // Body: show immediately — system sans is close enough until Montserrat arrives.
  display: "swap",
  preload: true,
});

/**
 * Brush display (brand / hero). `block` avoids a flash of system UI font;
 * woff2 keeps the invisible window short (~4× smaller than the old OTF).
 */
const rhythmic = localFont({
  src: "./fonts/Rhythmic-Cyrillic.woff2",
  variable: "--font-rhythmic",
  display: "block",
  weight: "400",
  style: "normal",
  preload: true,
  adjustFontFallback: "Arial",
});

/** Kept as fallback while comparing display faces. */
const unutterable = localFont({
  src: "./fonts/Unutterable-Italic.woff2",
  variable: "--font-unutterable",
  display: "block",
  weight: "400",
  style: "normal",
  preload: false,
  adjustFontFallback: "Arial",
});

const rubikDirt = Rubik_Dirt({
  variable: "--font-rubik-dirt",
  weight: "400",
  subsets: ["latin", "cyrillic"],
  display: "block",
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteConfig.brandName} — бронирование квестов`,
    template: `%s — ${siteConfig.brandName}`,
  },
  description:
    "Яркие сценарии и живые эмоции. Оставьте заявку на квест — менеджер свяжется и подтвердит запись.",
  applicationName: siteConfig.brandName,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0707" },
    { media: "(prefers-color-scheme: light)", color: "#0a0707" },
  ],
  icons: {
    // Google: square >48px, crawlable, stable URL. Tiny sizes use НК monogram (not a soft wordmark).
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-96.png", type: "image/png", sizes: "96x96" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: `${siteUrl}/`,
    siteName: siteConfig.brandName,
    title: `${siteConfig.brandName} — бронирование квестов`,
    description:
      "Яркие сценарии и живые эмоции. Оставьте заявку на квест — менеджер свяжется и подтвердит запись.",
    images: [
      {
        url: "/brand/og-share.jpg",
        width: 1200,
        height: 630,
        alt: `${siteConfig.brandName} — бронирование квестов`,
        type: "image/jpeg",
        secureUrl: `${siteUrl}/brand/og-share.jpg`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.brandName} — бронирование квестов`,
    description:
      "Яркие сценарии и живые эмоции. Оставьте заявку на квест — менеджер свяжется и подтвердит запись.",
    images: [`${siteUrl}/brand/og-share.jpg`],
  },
  // VK reads og:* and optionally vk:image for link snippets.
  other: {
    "vk:image": `${siteUrl}/brand/og-share.jpg`,
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    // Public Webmaster token (also overridable via env).
    yandex: process.env.YANDEX_VERIFICATION || "4b786bd2b169fcd0",
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
        <OrganizationJsonLd />
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
