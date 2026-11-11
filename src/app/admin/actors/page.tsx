import { ActorsManager } from "@/components/admin/actors-manager";
import { listCities } from "@/lib/city";
import { dbUrgent } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminActorsPage() {
  const [cities, actors] = await Promise.all([
    listCities(),
    dbUrgent((prisma) =>
      prisma.actor.findMany({
        orderBy: [{ city: { name: "asc" } }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          hourlyRate: true,
          cityId: true,
          city: { select: { name: true } },
        },
      })
    ),
  ]);

  return (
    <main className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Актёры</h1>
        <p className="text-sm text-muted-foreground">
          Состав по городам и ставка для отчётов по выплатам.
        </p>
      </div>
      <ActorsManager
        cities={cities}
        actors={actors.map((a) => ({
          id: a.id,
          name: a.name,
          hourlyRate: a.hourlyRate.toString(),
          cityId: a.cityId,
          cityName: a.city.name,
        }))}
      />
    </main>
  );
}
