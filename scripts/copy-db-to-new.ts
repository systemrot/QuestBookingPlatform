/**
 * 1:1 перенос данных Sydney → новая БД (Frankfurt).
 *
 * Требует в .env:
 *   DIRECT_URL или DATABASE_URL  — старая (источник)
 *   NEW_DIRECT_URL               — новая direct/session URI (приёмник)
 *
 * Перед запуском: схема на новой БД уже должна быть (prisma db push).
 *
 *   npx tsx scripts/copy-db-to-new.ts
 */
import "dotenv/config";
import pg from "pg";

const TABLES = [
  "User",
  "Quest",
  "Actor",
  "Slot",
  "Booking",
  "Assignment",
  "ChatMessage",
] as const;

function mustUrl(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Задай ${name} в .env`);
  return v;
}

function quoteIdent(name: string) {
  return `"${name.replace(/"/g, '""')}"`;
}

async function main() {
  const sourceUrl = mustUrl("DIRECT_URL", process.env.DATABASE_URL);
  const targetUrl = mustUrl("NEW_DIRECT_URL");

  if (sourceUrl === targetUrl) {
    throw new Error("Источник и приёмник совпадают — проверь NEW_DIRECT_URL");
  }

  const src = new pg.Client({
    connectionString: sourceUrl,
    ssl: { rejectUnauthorized: false },
  });
  const dst = new pg.Client({
    connectionString: targetUrl,
    ssl: { rejectUnauthorized: false },
  });

  await src.connect();
  await dst.connect();
  console.log("Connected source + target");

  await dst.query("BEGIN");
  try {
    await dst.query(
      "TRUNCATE TABLE " +
        TABLES.map(quoteIdent).join(", ") +
        " RESTART IDENTITY CASCADE"
    );

    for (const table of TABLES) {
      const { rows } = await src.query(`SELECT * FROM ${quoteIdent(table)}`);
      console.log(`${table}: ${rows.length} rows`);
      if (rows.length === 0) continue;

      const cols = Object.keys(rows[0]);
      const colList = cols.map(quoteIdent).join(", ");

      for (const row of rows) {
        const values = cols.map((c) => row[c]);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
        await dst.query(
          `INSERT INTO ${quoteIdent(table)} (${colList}) VALUES (${placeholders})`,
          values
        );
      }
    }

    await dst.query("COMMIT");
    console.log("OK: data copied");
  } catch (e) {
    await dst.query("ROLLBACK");
    throw e;
  } finally {
    await src.end().catch(() => undefined);
    await dst.end().catch(() => undefined);
  }

  // sanity counts
  const check = new pg.Client({
    connectionString: targetUrl,
    ssl: { rejectUnauthorized: false },
  });
  await check.connect();
  for (const table of TABLES) {
    const r = await check.query(
      `SELECT COUNT(*)::int AS n FROM ${quoteIdent(table)}`
    );
    console.log(`target ${table}: ${r.rows[0].n}`);
  }
  await check.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
