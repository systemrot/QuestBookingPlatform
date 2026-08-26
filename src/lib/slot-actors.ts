import { dbUrgent } from "@/lib/prisma";

export type SyncSlotActorsResult =
  | { ok: true }
  | {
      ok: false;
      error: "missing_slot" | "missing_actors" | "city_mismatch" | "mismatch";
    };

/**
 * Синхронизация актёров слота только через Prisma Client API
 * (без $queryRaw / UNNEST / VALUES — они дают syntax error на adapter+pooler).
 * Актёры должны быть из того же города, что и квест слота.
 */
export async function syncSlotActors(
  slotId: string,
  actorIds: string[]
): Promise<SyncSlotActorsResult> {
  const uniqueIds = [
    ...new Set(actorIds.filter((id) => typeof id === "string" && id.length > 0)),
  ];

  return dbUrgent(async (prisma) => {
    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
      select: {
        id: true,
        quest: { select: { cityId: true } },
      },
    });
    if (!slot) return { ok: false, error: "missing_slot" };

    if (uniqueIds.length > 0) {
      const actors = await prisma.actor.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true, cityId: true },
      });
      if (actors.length !== uniqueIds.length) {
        return { ok: false, error: "missing_actors" };
      }
      if (actors.some((a) => a.cityId !== slot.quest.cityId)) {
        return { ok: false, error: "city_mismatch" };
      }
    }

    const existing = await prisma.assignment.findMany({
      where: { slotId },
      select: { id: true, actorId: true },
    });

    const wanted = new Set(uniqueIds);
    const toDeleteIds = existing
      .filter((row) => !wanted.has(row.actorId))
      .map((row) => row.id);
    const have = new Set(existing.map((row) => row.actorId));
    const toAdd = uniqueIds.filter((id) => !have.has(id));

    if (toDeleteIds.length > 0) {
      await prisma.assignment.deleteMany({
        where: { id: { in: toDeleteIds } },
      });
    }

    for (const actorId of toAdd) {
      await prisma.assignment.create({
        data: { actorId, slotId },
      });
    }

    const after = await prisma.assignment.findMany({
      where: { slotId },
      select: { actorId: true },
    });
    const afterSet = new Set(after.map((a) => a.actorId));
    const match =
      afterSet.size === wanted.size &&
      [...wanted].every((id) => afterSet.has(id));

    if (!match) return { ok: false, error: "mismatch" };
    return { ok: true };
  });
}
