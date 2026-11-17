import { auth } from "@/auth";
import { CityLocalJsonLd } from "@/components/city-local-json-ld";
import { CitySeoPanel } from "@/components/city-seo-panel";
import { HomeHero } from "@/components/home-hero";
import {
  QuestCatalogCard,
  type QuestForCatalog,
} from "@/components/quest-catalog-card";
import { propVariantForQuestTitle } from "@/components/quest-card-prop";
import {
  getCityBySlug,
  type CitySlug,
} from "@/lib/city";
import { getQuestCatalog } from "@/lib/data";

type Props = {
  citySlug: CitySlug;
};

export async function HomeCatalog({ citySlug }: Props) {
  const session = await auth();

  let catalogUnavailable = false;
  let quests: Awaited<ReturnType<typeof getQuestCatalog>> = [];
  let cityName: string | null = null;

  try {
    const city = await getCityBySlug(citySlug);
    if (!city) {
      catalogUnavailable = true;
    } else {
      cityName = city.name;
      quests = await getQuestCatalog(city.id);
    }
  } catch {
    catalogUnavailable = true;
  }

  const catalog: QuestForCatalog[] = quests.map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    image: q.image,
    imageAlt: q.imageAlt ?? null,
    cityName,
    price: q.price.toString(),
    propVariant: propVariantForQuestTitle(q.title),
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
      <CityLocalJsonLd citySlug={citySlug} />
      <HomeHero
        catalogCount={catalog.length}
        citySlug={citySlug}
        catalogLabel="Каталог квестов"
        seo={<CitySeoPanel citySlug={citySlug} />}
      >
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
          <ul className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">
            {catalog.map((quest) => (
              <li key={quest.id} className="min-w-0 h-full">
                <QuestCatalogCard quest={quest} session={sessionInfo} />
              </li>
            ))}
          </ul>
        )}
      </HomeHero>
    </main>
  );
}
