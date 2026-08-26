import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: `Политика конфиденциальности — ${siteConfig.brandName}`,
  description: "Как НеКвест обрабатывает персональные данные пользователей.",
};

export default function PrivacyPage() {
  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Политика конфиденциальности
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {siteConfig.brandName} · действует с 26 августа 2026 г.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-2">
          <h2 className="font-heading text-base font-medium text-foreground">1. Общие положения</h2>
          <p>
            Настоящая Политика описывает, какие данные мы получаем при использовании сервиса
            бронирования квестов «{siteConfig.brandName}» (далее — Сервис), расположенного по адресу{" "}
            <a
              href="https://quest-booking-platform.vercel.app"
              className="text-foreground underline-offset-4 hover:underline"
            >
              quest-booking-platform.vercel.app
            </a>
            , и как мы их используем.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-base font-medium text-foreground">
            2. Какие данные мы обрабатываем
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>имя, адрес электронной почты, номер телефона (если указан);</li>
            <li>данные аккаунта при входе через Яндекс, Google или VK (имя, email, аватар);</li>
            <li>сведения о бронированиях, оплатах и обращениях в поддержку;</li>
            <li>технические данные: IP-адрес, тип браузера, cookies, необходимые для сессии.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-base font-medium text-foreground">3. Цели обработки</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>создание и ведение учётной записи;</li>
            <li>оформление и подтверждение бронирований;</li>
            <li>приём оплаты и связь по статусу заказа;</li>
            <li>поддержка пользователей и улучшение работы Сервиса;</li>
            <li>исполнение требований законодательства РФ.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-base font-medium text-foreground">4. Передача третьим лицам</h2>
          <p>
            Данные могут передаваться провайдерам инфраструктуры и платежей (хостинг, база данных,
            платёжные сервисы, OAuth-провайдеры) только в объёме, необходимом для работы Сервиса.
            Мы не продаём персональные данные.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-base font-medium text-foreground">5. Хранение и защита</h2>
          <p>
            Данные хранятся, пока существует аккаунт или пока это нужно для бронирований и
            бухгалтерии. Доступ ограничен техническими и организационными мерами. Пароли (при
            регистрации по email) хранятся в виде хеша.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-base font-medium text-foreground">6. Ваши права</h2>
          <p>
            Вы можете запросить уточнение, исправление или удаление данных, а также отозвать
            согласие на обработку, написав нам через контакты в подвале сайта (Telegram / VK) или
            через чат в личном кабинете. Отдельные данные мы обязаны хранить по закону.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-base font-medium text-foreground">7. Cookies</h2>
          <p>
            Сервис использует cookies для авторизации и стабильной работы сессии. Отключение cookies
            может сделать вход и бронирование недоступными.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-base font-medium text-foreground">8. Изменения</h2>
          <p>
            Мы можем обновлять Политику. Актуальная версия всегда доступна на этой странице.
            Продолжая пользоваться Сервисом после изменений, вы принимаете обновлённую редакцию.
          </p>
        </section>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/" className={cn(buttonVariants())}>
          На главную
        </Link>
        <Link href="/terms" className={cn(buttonVariants({ variant: "outline" }))}>
          Условия использования
        </Link>
      </div>
    </main>
  );
}
