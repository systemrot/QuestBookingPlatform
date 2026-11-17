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
      `ALTER TABLE "Quest" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3)`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "Quest_archivedAt_idx" ON "Quest"("archivedAt")`
    );
    console.log("ok archivedAt");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
