/**
 * Verifies the same DB path the app uses (Prisma + pg adapter).
 * Run: npx tsx --tsconfig tsconfig.json scripts/verify-admin-db.ts
 */
import "dotenv/config";
import { pathToFileURL } from "node:url";
import path from "node:path";

async function main() {
  // Ensure env before prisma module loads.
  if (!process.env.DATABASE_URL && process.env.DATABASE_URL_TX) {
    process.env.DATABASE_URL = process.env.DATABASE_URL_TX;
  }

  const prismaPath = pathToFileURL(
    path.join(process.cwd(), "src/lib/prisma.ts")
  ).href;
  const dataPath = pathToFileURL(
    path.join(process.cwd(), "src/lib/data.ts")
  ).href;

  const { db } = await import(prismaPath);
  const { getAdminPageData, getQuestCatalog } = await import(dataPath);

  const t0 = Date.now();
  const ping = await db((p: { $queryRaw: Function }) => p.$queryRaw`SELECT 1`);
  console.log(JSON.stringify({ step: "ping", ms: Date.now() - t0, ping }));

  const t1 = Date.now();
  const cities = await db((p: {
    city: { findMany: Function };
  }) => p.city.findMany({ select: { id: true, slug: true } }));
  const cityId = cities[0]?.id as string | undefined;
  if (!cityId) throw new Error("No cities — run migrate + seed");
  const catalog = await getQuestCatalog(cityId);
  console.log(
    JSON.stringify({
      step: "catalog",
      ms: Date.now() - t1,
      n: catalog.length,
      city: cities[0]?.slug,
    })
  );

  const t2 = Date.now();
  const admin = await getAdminPageData("all");
  console.log(
    JSON.stringify({
      step: "admin",
      ms: Date.now() - t2,
      actors: admin.actors.length,
      bookedSlots: admin.bookedSlots.length,
    })
  );

  const t3 = Date.now();
  await Promise.all([getQuestCatalog(cityId), getAdminPageData("all")]);
  console.log(JSON.stringify({ step: "parallel-catalog+admin", ms: Date.now() - t3 }));

  console.log(JSON.stringify({ ok: true, totalMs: Date.now() - t0 }));
}

main().catch((e) => {
  console.error(JSON.stringify({ ok: false, error: String(e) }));
  process.exit(1);
});
