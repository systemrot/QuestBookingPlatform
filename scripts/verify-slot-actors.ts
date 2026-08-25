import "dotenv/config";
import { syncSlotActors } from "../src/lib/slot-actors";
import { dbUrgent } from "../src/lib/prisma";

async function main() {
  const slotId = "644868f3-dafd-47d2-a889-1a545adb089b";
  const actors = await dbUrgent((p) =>
    p.actor.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })
  );
  const allIds = actors.map((a) => a.id);

  const r1 = await syncSlotActors(slotId, allIds);
  const r2 = await syncSlotActors(slotId, allIds.slice(0, 2));
  const r3 = await syncSlotActors(slotId, allIds);

  const names = await dbUrgent((p) =>
    p.assignment.findMany({
      where: { slotId },
      include: { actor: { select: { name: true } } },
      orderBy: { actor: { name: "asc" } },
    })
  );

  console.log({ r1, r2, r3, names: names.map((n) => n.actor.name) });
  if (!r1.ok || !r2.ok || !r3.ok) process.exit(1);
  if (names.length !== allIds.length) process.exit(1);
  console.log("PASS");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
