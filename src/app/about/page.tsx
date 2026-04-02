import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: `О нас — ${siteConfig.brandName}`,
  description: "Информация о сервисе бронирования квестов.",
};

export default function AboutPage() {
  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">О нас</h1>
      <p className="mt-2 text-sm text-muted-foreground">{siteConfig.brandName}</p>

      <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          {siteConfig.footerAbout}
        </p>
        <p>
          На этой странице позже можно разместить историю бренда, команду, контакты площадок и ответы на частые вопросы. Сейчас это рабочий заглушечный раздел, чтобы ссылка из подвала сайта вела на осмысленный контент.
        </p>
        <p>
          Вопросы по бронированию и оплате вы можете задать через форму в личном кабинете или в наших соцсетях (ссылки внизу каждой страницы).
        </p>
      </div>

      <div className="mt-10">
        <Link href="/" className={cn(buttonVariants())}>
          На главную
        </Link>
      </div>
    </main>
  );
}
