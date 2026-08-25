import { auth } from "@/auth";
import {
  QuestCatalogCard,
  type QuestForCatalog,
} from "@/components/quest-catalog-card";
import { getQuestCatalog } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();

  let catalogUnavailable = false;
  let quests: Awaited<ReturnType<typeof getQuestCatalog>> = [];
  try {
    quests = await getQuestCatalog();
  } catch {
    catalogUnavailable = true;
  }

  const catalog: QuestForCatalog[] = quests.map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    image: q.image,
    price: q.price.toString(),
  }));

  const sessionInfo = session?.user
    ? {
        role: session.user.role,
        name: session.user.name,
        email: session.user.email,
      }
    : null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-4 py-12 sm:px-6">
      <section className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Бронирование квестов
        </p>
        <h1 className="max-w-2xl font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Яркие сценарии и живые эмоции — в одном шаге от вас.
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Выберите квест, удобную дату и время для вашей команды. Слот держится
          20 минут — успеете спокойно оплатить.
        </p>
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-heading text-xl font-medium">Каталог квестов</h2>
          {!catalogUnavailable ? (
            <span className="text-xs text-muted-foreground">
              {catalog.length}{" "}
              {catalog.length === 1
                ? "квест"
                : catalog.length >= 2 && catalog.length <= 4
                  ? "квеста"
                  : "квестов"}
            </span>
          ) : null}
        </div>
        {catalogUnavailable ? (
          <div className="rounded-xl border border-border/80 bg-muted/20 p-10 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Каталог временно недоступен</p>
            <p className="mt-2">
              Мы уже работаем над этим. Попробуйте обновить страницу чуть позже.
            </p>
          </div>
        ) : catalog.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-10 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Пока нет доступных квестов</p>
            <p className="mt-2">Загляните позже — новые сценарии скоро появятся в каталоге.</p>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((quest) => (
              <li key={quest.id}>
                <QuestCatalogCard quest={quest} session={sessionInfo} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
