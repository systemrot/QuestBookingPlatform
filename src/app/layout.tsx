import type { Metadata } from "next";
import Image from "next/image";
import { Geist_Mono, Montserrat } from "next/font/google";

import { auth } from "@/auth";
import { ChatWidget } from "@/components/chat/chat-widget";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const CINEMATIC_BG_IMAGE =
  "https://images.unsplash.com/photo-1741993348688-544565cfcfe3?auto=format&fit=crop&w=2400&q=85";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "КвестБук — бронирование квестов",
  description: "Выбирайте квесты и бронируйте удобное время онлайн.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`dark ${montserrat.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-transparent text-foreground">
        <div aria-hidden className="cinematic-bg">
          <Image
            src={CINEMATIC_BG_IMAGE}
            alt=""
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            quality={75}
            // Unsplash через /_next/image часто таймаутится 10–20с и тормозит первый paint.
            unoptimized
            className="cinematic-bg-image"
          />
          <div className="cinematic-bg-vignette" />
          <div className="cinematic-bg-grade" />
          <div className="cinematic-bg-overlay" />
          <div className="cinematic-bg-grain" />
          <div className="cinematic-bg-scanlines" />
        </div>
        <SiteHeader />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <div className="flex-1">{children}</div>
          <Footer />
        </div>
        {session?.user?.role === "USER" ? <ChatWidget /> : null}
        <Toaster richColors />
      </body>
    </html>
  );
}
