import { QuestsManager } from "@/components/admin/quests-manager";
import { listCities } from "@/lib/city";
import { dbUrgent } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminQuestsPage() {
  const [cities, quests] = await Promise.all([
    listCities(),
    dbUrgent((prisma) =>
      prisma.quest.findMany({
        orderBy: [
          { city: { name: "asc" } },
          { sortOrder: "asc" },
          { title: "asc" },
        ],
        select: {
          id: true,
          title: true,
          description: true,
          image: true,
          imageAlt: true,
          price: true,
          cityId: true,
          sortOrder: true,
          archivedAt: true,
          city: { select: { name: true } },
        },
      })
    ),
  ]);

  return (
    <main className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Квесты</h1>
        <p className="text-sm text-muted-foreground">
          Создание и правка сценариев: город, цена, фото, описание. С главной
          квесты убираются в архив; удаление — только из архива.
        </p>
      </div>
      <QuestsManager
        cities={cities}
        quests={quests.map((q) => ({
          id: q.id,
          title: q.title,
          description: q.description,
          image: q.image,
          imageAlt: q.imageAlt,
          price: q.price.toString(),
          cityId: q.cityId,
          cityName: q.city.name,
          sortOrder: q.sortOrder,
          archivedAt: q.archivedAt?.toISOString() ?? null,
        }))}
      />
    </main>
  );
}
