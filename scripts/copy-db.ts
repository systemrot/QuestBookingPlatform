/**
 * Copies all app data from one Postgres to another (e.g. Supabase → own server).
 *
 *   SOURCE_DATABASE_URL — where data comes from (Supabase; pooler URL is fine)
 *   TARGET_DATABASE_URL — empty DB with schema applied via `npm run db:deploy`
 *
 *   npx tsx scripts/copy-db.ts
 *
 * Source is only read. Target tables are truncated and refilled in one transaction.
 */
import "dotenv/config";
import pg from "pg";

const TABLES = [
  "User",
  "City",
  "Quest",
  "Actor",
  "Slot",
  "Booking",
  "Assignment",
  "ChatMessage",
] as const;

const BATCH = 200;

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Задай ${name} в .env`);
  return v;
}

function quoteIdent(name: string) {
  return `"${name.replace(/"/g, '""')}"`;
}

function connect(raw: string) {
  const url = new URL(raw);
  const isSupabase = url.hostname.includes("supabase.co") || url.hostname.includes("supabase.com");
  url.searchParams.delete("pgbouncer");
  if (isSupabase) url.searchParams.delete("sslmode");
  const client = new pg.Client({
    connectionString: url.toString(),
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
    // Keep every value as Postgres text so timestamps/enums round-trip byte-for-byte.
    types: { getTypeParser: () => (value: string) => value },
  });
  client.on("error", (e) => console.error("[pg]", e.message));
  return client;
}

async function main() {
  const sourceUrl = mustEnv("SOURCE_DATABASE_URL");
  const targetUrl = mustEnv("TARGET_DATABASE_URL");
  if (sourceUrl === targetUrl) throw new Error("SOURCE и TARGET совпадают");

  const src = connect(sourceUrl);
  const dst = connect(targetUrl);
  await src.connect();
  await dst.connect();
  console.log("Connected source + target");

  try {
    await dst.query("BEGIN");
    await dst.query(
      `TRUNCATE TABLE ${TABLES.map(quoteIdent).join(", ")} RESTART IDENTITY CASCADE`
    );

    for (const table of TABLES) {
      const { rows, fields } = await src.query(`SELECT * FROM ${quoteIdent(table)}`);
      console.log(`${table}: ${rows.length} rows`);
      if (rows.length === 0) continue;

      const cols = fields.map((f) => f.name);
      const colList = cols.map(quoteIdent).join(", ");

      for (let i = 0; i < rows.length; i += BATCH) {
        const chunk = rows.slice(i, i + BATCH);
        const values: unknown[] = [];
        const tuples = chunk.map((row) => {
          const ph = cols.map((c) => {
            values.push(row[c]);
            return `$${values.length}`;
          });
          return `(${ph.join(", ")})`;
        });
        await dst.query(
          `INSERT INTO ${quoteIdent(table)} (${colList}) VALUES ${tuples.join(", ")}`,
          values
        );
      }
    }

    await dst.query("COMMIT");
    console.log("OK: data copied");

    for (const table of TABLES) {
      const [a, b] = await Promise.all([
        src.query(`SELECT COUNT(*)::int AS n FROM ${quoteIdent(table)}`),
        dst.query(`SELECT COUNT(*)::int AS n FROM ${quoteIdent(table)}`),
      ]);
      const mark = a.rows[0].n === b.rows[0].n ? "ok" : "MISMATCH";
      console.log(`${table}: source ${a.rows[0].n} / target ${b.rows[0].n} ${mark}`);
    }
  } catch (e) {
    await dst.query("ROLLBACK").catch(() => undefined);
    throw e;
  } finally {
    await src.end().catch(() => undefined);
    await dst.end().catch(() => undefined);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
