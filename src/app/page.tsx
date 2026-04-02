import { auth } from "@/auth";
import {
  QuestCatalogCard,
  type QuestForCatalog,
} from "@/components/quest-catalog-card";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const getCachedQuests = unstable_cache(
  async () =>
    prisma.quest.findMany({
      orderBy: { title: "asc" },
    }),
  ["quest-catalog"],
  { revalidate: 300 },
);

export default async function HomePage() {
  const session = await auth();

  let quests: {
    id: string;
    title: string;
    description: string | null;
    image: string | null;
    price: { toString(): string };
  }[] = [];
  let dbError: string | null = null;
  try {
    quests = await getCachedQuests();
  } catch (e) {
    dbError =
      e instanceof Error
        ? e.message
        : "Не удалось подключиться к базе данных. Проверьте DATABASE_URL и выполните миграции.";
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
          Выберите квест, удобную дату и время для вашей команды. Интерфейс
          сразу в темной теме — комфортно даже при долгом выборе.
        </p>
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-heading text-xl font-medium">Каталог квестов</h2>
          <span className="text-xs text-muted-foreground">
            {catalog.length} квестов
          </span>
        </div>
        {dbError && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            <p className="font-medium">База данных недоступна</p>
            <p className="mt-1 text-amber-100/80">
              Обновите{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
                DATABASE_URL
              </code>{" "}
              в{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
                .env
              </code>
              , затем выполните{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
                npx prisma migrate dev
              </code>
              .
            </p>
          </div>
        )}
        {catalog.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-10 text-center text-sm text-muted-foreground">
            Пока нет квестов. Выполните{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">
              npx prisma migrate dev
            </code>{" "}
            и{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">
              npm run db:seed
            </code>{" "}
            для загрузки тестовых данных.
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
