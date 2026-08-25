import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL required");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

const statements = [
  `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3)`,
  `ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS "Booking_slotId_key"`,
  `CREATE INDEX IF NOT EXISTS "Booking_slotId_idx" ON "Booking"("slotId")`,
  `CREATE INDEX IF NOT EXISTS "Booking_status_expiresAt_idx" ON "Booking"("status", "expiresAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Slot_questId_startTime_key" ON "Slot"("questId", "startTime")`,
  `CREATE INDEX IF NOT EXISTS "Slot_startTime_idx" ON "Slot"("startTime")`,
];

async function main() {
  for (const sql of statements) {
    process.stdout.write(`→ ${sql.slice(0, 72)}... `);
    await prisma.$executeRawUnsafe(sql);
    console.log("ok");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
