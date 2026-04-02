import type { Metadata } from "next";
import { Geist_Mono, Montserrat } from "next/font/google";

import { auth } from "@/auth";
import { ChatWidget } from "@/components/chat/chat-widget";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

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
          <div className="cinematic-bg-image" />
          <div className="cinematic-bg-vignette" />
          <div className="cinematic-bg-overlay" />
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
