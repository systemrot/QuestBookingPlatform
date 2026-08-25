import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";
import { listScheduleStarts, slotEndTime } from "../src/lib/booking-policy";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL required");

function client() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: url! }),
  });
}

async function withDb<T>(fn: (p: PrismaClient) => Promise<T>) {
  const p = client();
  try {
    return await fn(p);
  } finally {
    await p.$disconnect();
  }
}

async function main() {
  const starts = listScheduleStarts(new Date());
  console.log(`schedule starts: ${starts.length}`);

  const quests = await withDb((p) =>
    p.quest.findMany({ select: { id: true, title: true, price: true } })
  );

  for (const q of quests) {
    // create in chunks of 10 to survive pooler
    for (let i = 0; i < starts.length; i += 10) {
      const chunk = starts.slice(i, i + 10);
      await withDb(async (p) => {
        const result = await p.slot.createMany({
          data: chunk.map((start) => ({
            questId: q.id,
            startTime: start,
            endTime: slotEndTime(start),
            price: q.price,
            isBooked: false,
          })),
          skipDuplicates: true,
        });
        console.log(`${q.title}: chunk ${i / 10 + 1} +${result.count}`);
      });
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
