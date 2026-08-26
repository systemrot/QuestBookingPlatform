/**
 * Applies cities migration via pooler with retries.
 * Run: npx tsx scripts/apply-cities-migration.ts
 */
import "dotenv/config";
import pg from "pg";

const url = process.env.DATABASE_URL_TX || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL required");

const MIGRATION_NAME = "202608261400_add_cities";

async function withClient<T>(fn: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = new pg.Client({
    connectionString: url,
    connectionTimeoutMillis: 20_000,
    statement_timeout: 60_000,
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function exec(sql: string, label: string) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      process.stdout.write(`→ ${label}… `);
      await withClient((c) => c.query(sql));
      console.log("ok");
      return;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`fail(${attempt}): ${msg}`);
      if (attempt === 4) throw e;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

async function queryOne<T extends Record<string, unknown>>(sql: string) {
  return withClient(async (c) => {
    const res = await c.query(sql);
    return res.rows[0] as T | undefined;
  });
}

async function main() {
  const city = await queryOne<{ exists: boolean }>(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'City'
    ) AS exists
  `);

  if (!city?.exists) {
    await exec(
      `CREATE TABLE "City" (
        "id" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "City_pkey" PRIMARY KEY ("id")
      )`,
      "create City"
    );
    await exec(
      `CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug")`,
      "City_slug_key"
    );
  } else {
    console.log("City already exists");
  }

  await exec(
    `INSERT INTO "City" ("id", "slug", "name", "createdAt", "updatedAt") VALUES
      ('c_oryol', 'oryol', 'Орёл', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('c_smolensk', 'smolensk', 'Смоленск', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name", "updatedAt" = CURRENT_TIMESTAMP`,
    "upsert cities"
  );

  const questCol = await queryOne<{ exists: boolean }>(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Quest' AND column_name = 'cityId'
    ) AS exists
  `);
  if (!questCol?.exists) {
    await exec(`ALTER TABLE "Quest" ADD COLUMN "cityId" TEXT`, "Quest.cityId");
  }
  await exec(
    `UPDATE "Quest" SET "cityId" = 'c_oryol' WHERE "cityId" IS NULL`,
    "backfill Quest"
  );
  await exec(
    `ALTER TABLE "Quest" ALTER COLUMN "cityId" SET NOT NULL`,
    "Quest.cityId NOT NULL"
  );

  const actorCol = await queryOne<{ exists: boolean }>(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Actor' AND column_name = 'cityId'
    ) AS exists
  `);
  if (!actorCol?.exists) {
    await exec(`ALTER TABLE "Actor" ADD COLUMN "cityId" TEXT`, "Actor.cityId");
  }
  await exec(
    `UPDATE "Actor" SET "cityId" = 'c_oryol' WHERE "cityId" IS NULL`,
    "backfill Actor"
  );
  await exec(
    `ALTER TABLE "Actor" ALTER COLUMN "cityId" SET NOT NULL`,
    "Actor.cityId NOT NULL"
  );

  await exec(
    `CREATE INDEX IF NOT EXISTS "Quest_cityId_idx" ON "Quest"("cityId")`,
    "Quest_cityId_idx"
  );
  await exec(
    `CREATE UNIQUE INDEX IF NOT EXISTS "Quest_cityId_title_key" ON "Quest"("cityId", "title")`,
    "Quest_cityId_title_key"
  );
  await exec(
    `CREATE INDEX IF NOT EXISTS "Actor_cityId_idx" ON "Actor"("cityId")`,
    "Actor_cityId_idx"
  );

  await exec(
    `DO $$ BEGIN
      ALTER TABLE "Quest" ADD CONSTRAINT "Quest_cityId_fkey"
        FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$`,
    "Quest FK"
  );
  await exec(
    `DO $$ BEGIN
      ALTER TABLE "Actor" ADD CONSTRAINT "Actor_cityId_fkey"
        FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$`,
    "Actor FK"
  );

  console.log("ok:", MIGRATION_NAME);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
