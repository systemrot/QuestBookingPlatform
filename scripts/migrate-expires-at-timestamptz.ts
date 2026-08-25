/**
 * expiresAt: timestamp → timestamptz.
 * Старые значения писались как «локальные» (MSK) naive — интерпретируем как Europe/Moscow.
 */
import "dotenv/config";
import pg from "pg";

function toSession(url: string) {
  if (!url.includes(":6543/")) return url;
  return url
    .replace(":6543/", ":5432/")
    .replace("?pgbouncer=true&sslmode=no-verify", "?sslmode=no-verify")
    .replace("pgbouncer=true&", "")
    .replace("pgbouncer=true", "");
}

async function main() {
  const url = toSession(process.env.NEW_DATABASE_URL ?? process.env.DATABASE_URL!);
  const c = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  c.on("error", () => undefined);
  await c.connect();

  const typ = await c.query(`
    SELECT format_type(a.atttypid, a.atttypmod) AS typ
    FROM pg_attribute a
    JOIN pg_class r ON r.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = 'public' AND r.relname = 'Booking' AND a.attname = 'expiresAt'
  `);
  console.log("before:", typ.rows[0]?.typ);

  await c.query(`
    ALTER TABLE "Booking"
    ALTER COLUMN "expiresAt" TYPE TIMESTAMPTZ(3)
    USING CASE
      WHEN "expiresAt" IS NULL THEN NULL
      ELSE "expiresAt" AT TIME ZONE 'Europe/Moscow'
    END
  `);

  const after = await c.query(`
    SELECT format_type(a.atttypid, a.atttypmod) AS typ
    FROM pg_attribute a
    JOIN pg_class r ON r.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = 'public' AND r.relname = 'Booking' AND a.attname = 'expiresAt'
  `);
  console.log("after:", after.rows[0]?.typ);

  const cleanup = await c.query(`
    UPDATE "Booking"
    SET status = 'CANCELLED', "expiresAt" = NULL, "updatedAt" = NOW()
    WHERE status = 'PENDING'
      AND "expiresAt" IS NOT NULL
      AND "expiresAt" <= NOW()
    RETURNING id
  `);
  console.log("cleaned expired PENDING:", cleanup.rowCount);

  await c.end();
  console.log("OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
