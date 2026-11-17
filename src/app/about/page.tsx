import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/** Раздел «Мир квестов» по Орлу — площадка-партнёр. */
const MIR_KVESTOV_URL = "https://orel.mir-kvestov.ru/";

export const metadata: Metadata = {
  title: "О нас",
  description:
    "НеКвест — страшные квесты для детей и взрослых в Орле и Смоленске. Официальный партнёр «Мир квестов». Онлайн-заявка на сайте.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        О нас
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {siteConfig.brandName}
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
            Кто мы
          </h2>
          <p>
            {siteConfig.brandName} — площадка страшных и атмосферных квестов для
            детей и взрослых. Играйте в Орле и Смоленске: живые сценарии, сильные
            эмоции и команда, которая проведёт вас от заявки до финала.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
            Партнёрство
          </h2>
          <p>
            Мы — официальный партнёр{" "}
            <a
              href={MIR_KVESTOV_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2 hover:text-primary"
            >
              «Мир квестов»
            </a>
            . Наши игры можно найти на их площадке, а заявку удобно оставить
            прямо здесь, на {siteConfig.brandName}.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
            Как записаться
          </h2>
          <p>
            Выберите город и квест в каталоге, укажите удобный слот и оставьте
            заявку онлайн. Цены и расписание — на сайте; по вопросам бронирования
            и оплаты поможем в личном кабинете или в соцсетях.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
            Связаться с нами
          </h2>
          <p>
            Пишите в{" "}
            <a
              href={siteConfig.social.vk}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2 hover:text-primary"
            >
              ВКонтакте
            </a>{" "}
            или{" "}
            <a
              href={siteConfig.social.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2 hover:text-primary"
            >
              Telegram
            </a>
            — ссылки также внизу каждой страницы.
          </p>
        </section>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/oryol#catalog" className={cn(buttonVariants())}>
          Смотреть квесты
        </Link>
        <Link
          href="/oryol"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          На главную
        </Link>
      </div>
    </main>
  );
}
