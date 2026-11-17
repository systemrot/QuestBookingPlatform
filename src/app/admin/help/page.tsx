import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Info, Lightbulb } from "lucide-react";

import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button-variants";
import { isOwner, isStaff } from "@/lib/roles";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2 border-b border-border/60 pb-6 last:border-b-0 last:pb-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        {href ? (
          <Link
            href={href}
            className={cn(
              buttonVariants({ variant: "link", size: "sm" }),
              "h-auto px-0"
            )}
          >
            Открыть
          </Link>
        ) : null}
      </div>
      <div className="space-y-2 text-sm text-muted-foreground [&_li]:mt-1 [&_strong]:font-medium [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}

export default async function AdminHelpPage() {
  const session = await auth();
  if (!session?.user?.id || !isStaff(session.user.role)) {
    redirect("/");
  }

  const owner = isOwner(session.user.role);

  return (
    <main className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Info className="size-5 shrink-0" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide">
            Справка
          </span>
        </div>
        <h1 className="font-heading text-2xl font-semibold">
          Как пользоваться админкой
        </h1>
        <p className="text-sm text-muted-foreground">
          Оплата на сайте сейчас выключена — клиенты оставляют заявку, дальше вы
          связываетесь сами.
        </p>
      </div>

      <aside className="space-y-4 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-5 sm:px-5">
        <div className="flex items-start gap-3">
          <Lightbulb
            className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400"
            aria-hidden
          />
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
              Сейчас особенно важно
            </p>
            <h2 className="font-heading text-xl font-semibold text-foreground">
              Идеи, отзывы и баги
            </h2>
            <p className="text-sm text-muted-foreground">
              Платформа активно развивается — пишите всё, что мешает в работе
              или хотелось бы улучшить. Чем больше откликов от команды, тем
              понятнее, за что браться в первую очередь.
            </p>
          </div>
        </div>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground">
          <li>
            Можно оставить пожелание, отзыв или сообщить о проблеме — это видит
            вся команда.
          </li>
          <li>
            Ставьте лайки и дизлайки идеям коллег и обсуждайте в комментариях.
          </li>
        </ul>
        <Link
          href="/admin/feedback"
          className={cn(
            buttonVariants({ size: "sm" }),
            "bg-amber-700 text-white hover:bg-amber-800 dark:bg-amber-500 dark:text-amber-950 dark:hover:bg-amber-400"
          )}
        >
          Перейти к идеям
        </Link>
      </aside>

      <div className="space-y-6">
        <Section title="Расписание" href="/admin">
          <ul className="list-disc pl-5">
            <li>Здесь заявки и брони по всем квестам.</li>
            <li>Сверху можно отфильтровать заявки по городу.</li>
            <li>
              <strong>Заявка</strong> — клиент выбрал время и оставил контакты.
              Нужно перезвонить и договориться.
            </li>
            <li>
              Актёров назначайте из того же города, что и игра. К брони можно
              добавить заметку.
            </li>
            <li>
              В карточке брони можно отметить оплату или отменить запись.
            </li>
          </ul>
        </Section>

        <Section title="Сообщения" href="/admin/messages">
          <ul className="list-disc pl-5">
            <li>
              Переписка с клиентами с сайта. Если есть новые сообщения — в меню
              появится счётчик.
            </li>
            <li>Ответы видят клиенты в чате на сайте.</li>
          </ul>
        </Section>

        <Section title="Отчёты" href="/admin/reports">
          <ul className="list-disc pl-5">
            <li>
              Сколько заработали актёры: по числу назначенных игр и их ставке.
            </li>
            <li>
              Чтобы цифры были верными, сначала заведите актёров и назначайте их
              на игры в расписании.
            </li>
          </ul>
        </Section>

        {owner ? (
          <>
            <Section title="Квесты" href="/admin/quests">
              <ul className="list-disc pl-5">
                <li>Здесь можно добавлять и редактировать квесты.</li>
                <li>
                  Порядок на главной — перетаскиванием в списке (у каждого
                  города свой). На телефоне тяните за иконку слева.
                </li>
                <li>
                  С сайта квест убирается в <strong>Архив</strong>, не удалением.
                  Вернуть можно оттуда же; удалить навсегда — только из архива.
                </li>
                <li>
                  Изменения сразу видны на сайте — перед сохранением проверьте
                  город и цену.
                </li>
              </ul>
            </Section>

            <Section title="Актёры" href="/admin/actors">
              <ul className="list-disc pl-5">
                <li>Список актёров по городам и ставка для отчётов по выплатам.</li>
                <li>
                  Если актёра нет в нужном городе, его нельзя назначить на игру.
                </li>
              </ul>
            </Section>

            <Section title="Команда" href="/admin/team">
              <ul className="list-disc pl-5">
                <li>
                  Можно выдать или забрать права администратора у человека,
                  который уже зарегистрирован — по его email.
                </li>
                <li>
                  В списке только владельцы и админы, клиенты сюда не попадают.
                </li>
                <li>
                  Права владельца здесь не меняются. Перед выдачей или снятием
                  прав нужно подтверждение.
                </li>
              </ul>
            </Section>
          </>
        ) : (
          <Section title="Разделы только для владельца">
            <ul className="list-disc pl-5">
              <li>
                <strong>Квесты</strong>, <strong>Актёры</strong> и{" "}
                <strong>Команда</strong> доступны владельцу. Если нужно что-то
                поменять в каталоге или правах — напишите владельцу.
              </li>
            </ul>
          </Section>
        )}

        <Section title="Роли">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="font-medium text-foreground">Администратор</p>
              <ul className="list-disc pl-5">
                <li>Смотрит заявки и брони, назначает актёров, пишет заметки.</li>
                <li>Отвечает клиентам в сообщениях.</li>
                <li>Смотрит отчёты по выплатам актёрам.</li>
                <li>Пишет идеи, голосует и комментирует на доске.</li>
                <li>
                  Не может менять квесты, актёров и права других людей.
                </li>
              </ul>
            </div>
            <div className="space-y-1.5">
              <p className="font-medium text-foreground">Владелец</p>
              <ul className="list-disc pl-5">
                <li>Может всё то же, что администратор.</li>
                <li>Добавляет и правит квесты на сайте.</li>
                <li>Ведёт список актёров и их ставки.</li>
                <li>
                  Выдаёт и забирает права администратора у уже
                  зарегистрированных людей.
                </li>
                <li>Может удалять идеи с доски.</li>
              </ul>
            </div>
            <p>
              С аккаунта администратора или владельца нельзя оставить заявку на
              квест как клиент — для этого нужен обычный пользовательский
              аккаунт.
            </p>
            <p>
              Имя и контакты меняются в разделе <strong>Профиль</strong> —
              так вас будут видеть коллеги в команде и на доске идей.
            </p>
          </div>
        </Section>
      </div>
    </main>
  );
}
