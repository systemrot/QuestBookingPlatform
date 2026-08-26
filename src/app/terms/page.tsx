import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: `Условия использования — ${siteConfig.brandName}`,
  description: "Правила пользования сервисом бронирования квестов НеКвест.",
};

export default function TermsPage() {
  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Условия использования
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {siteConfig.brandName} · действует с 26 августа 2026 г.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-2">
          <h2 className="font-heading text-base font-medium text-foreground">1. Предмет</h2>
          <p>
            Сервис «{siteConfig.brandName}» предоставляет возможность просматривать квесты,
            выбирать слоты и оформлять бронирование онлайн. Используя сайт, вы соглашаетесь с
            настоящими Условиями и{" "}
            <Link href="/privacy" className="text-foreground underline-offset-4 hover:underline">
              Политикой конфиденциальности
            </Link>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-base font-medium text-foreground">2. Аккаунт</h2>
          <p>
            Для бронирования нужна регистрация или вход (email/пароль либо Яндекс, Google, VK). Вы
            отвечаете за сохранность доступа к аккаунту и за достоверность указанных данных.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-base font-medium text-foreground">3. Бронирование</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>слот может удерживаться ограниченное время до оплаты (холд);</li>
            <li>бронь считается подтверждённой после успешной оплаты по правилам Сервиса;</li>
            <li>
              отмена и перенос регулируются правилами конкретной площадки / квеста и статусом
              оплаты;
            </li>
            <li>одновременно может действовать один активный неоплаченный холд.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-base font-medium text-foreground">4. Оплата</h2>
          <p>
            Оплата производится через подключённые платёжные сервисы либо в тестовом режиме
            (если касса ещё не подключена). Цены указываются на сайте. При ошибке оплаты слот
            может быть освобождён.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-base font-medium text-foreground">5. Запрещённое использование</h2>
          <p>
            Запрещены автоматический парсинг без разрешения, попытки взлома, мошенничество с
            бронированиями и любое использование Сервиса вопреки закону РФ.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-base font-medium text-foreground">6. Ограничение ответственности</h2>
          <p>
            Сервис помогает организовать бронирование. Итоговый игровой опыт, состав команды
            актёров и условия на площадке зависят от организатора квеста. Мы не гарантируем
            бесперебойную работу сайта 24/7, но стремимся оперативно устранять сбои.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-base font-medium text-foreground">7. Изменения условий</h2>
          <p>
            Мы можем обновлять Условия. Новая редакция публикуется на этой странице. Существенные
            изменения по возможности отражаются на сайте.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-base font-medium text-foreground">8. Контакты</h2>
          <p>
            Вопросы по Сервису — через чат в личном кабинете или соцсети в подвале сайта
            (Telegram, VK).
          </p>
        </section>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/" className={cn(buttonVariants())}>
          На главную
        </Link>
        <Link href="/privacy" className={cn(buttonVariants({ variant: "outline" }))}>
          Политика конфиденциальности
        </Link>
      </div>
    </main>
  );
}
