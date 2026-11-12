import { auth } from "@/auth";
import { HomeHero } from "@/components/home-hero";
import {
  QuestCatalogCard,
  type QuestForCatalog,
} from "@/components/quest-catalog-card";
import { getSelectedCity } from "@/lib/city";
import { getQuestCatalog } from "@/lib/data";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function HomePage() {
  const session = await auth();

  let catalogUnavailable = false;
  let quests: Awaited<ReturnType<typeof getQuestCatalog>> = [];
  try {
    const city = await getSelectedCity();
    quests = await getQuestCatalog(city.id);
  } catch {
    catalogUnavailable = true;
  }

  const catalog: QuestForCatalog[] = quests.map((q, index) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    image: q.image,
    price: q.price.toString(),
    propVariant: (index % 3) as 0 | 1 | 2,
  }));

  const sessionInfo =
    session?.user?.role === "USER" ||
    session?.user?.role === "ADMIN" ||
    session?.user?.role === "OWNER"
      ? {
          role: session.user.role,
          name: session.user.name,
          email: session.user.email,
        }
      : null;

  return (
    <main className="flex w-full flex-1 flex-col">
      <HomeHero>
        {catalogUnavailable ? (
          <div className="rounded-xl border border-blood/30 bg-black/55 p-10 text-center text-sm text-white/70 backdrop-blur-md">
            <p className="font-medium text-white">Каталог временно недоступен</p>
            <p className="mt-2">Попробуйте обновить страницу чуть позже.</p>
          </div>
        ) : catalog.length === 0 ? (
          <div className="rounded-xl border border-dashed border-blood/35 bg-black/45 p-10 text-center text-sm text-white/70 backdrop-blur-md">
            <p className="font-medium text-white">Пока нет доступных квестов</p>
            <p className="mt-2">Новые сценарии скоро появятся в каталоге.</p>
          </div>
        ) : (
          <ul className="grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3 xl:gap-7">
            {catalog.map((quest) => (
              <li
                key={quest.id}
                className="min-w-0 h-full [filter:drop-shadow(0_0_34px_rgba(185,28,28,0.28))]"
              >
                <QuestCatalogCard quest={quest} session={sessionInfo} />
              </li>
            ))}
          </ul>
        )}
      </HomeHero>
    </main>
  );
}
