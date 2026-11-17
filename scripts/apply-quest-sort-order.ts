import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";

const url = process.env.DATABASE_URL_TX || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL required");

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Quest" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0`
    );
    await prisma.$executeRawUnsafe(`
      WITH ranked AS (
        SELECT
          id,
          (ROW_NUMBER() OVER (PARTITION BY "cityId" ORDER BY title ASC) - 1)::INTEGER AS rn
        FROM "Quest"
      )
      UPDATE "Quest" q
      SET "sortOrder" = ranked.rn
      FROM ranked
      WHERE q.id = ranked.id
    `);
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "Quest_cityId_sortOrder_idx" ON "Quest"("cityId", "sortOrder")`
    );

    const sample = await prisma.quest.findMany({
      select: { title: true, cityId: true, sortOrder: true },
      orderBy: [{ cityId: "asc" }, { sortOrder: "asc" }],
      take: 12,
    });
    console.log("ok", sample);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
