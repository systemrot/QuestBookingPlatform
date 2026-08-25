/**
 * 1:1 по смыслу для продакшена:
 * - User / Quest / Actor / Booking / Assignment / ChatMessage — все
 * - Slot — только те, на которые есть Booking/Assignment или isBooked
 *   (пустая сетка на Frankfurt не нужна: слоты виртуальные)
 */
import "dotenv/config";
import pg from "pg";

function must(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

function toSession(url: string) {
  if (!url.includes(":6543/")) return url;
  return url
    .replace(":6543/", ":5432/")
    .replace("?pgbouncer=true&sslmode=no-verify", "?sslmode=no-verify")
    .replace("pgbouncer=true&", "")
    .replace("pgbouncer=true", "");
}

function qid(name: string) {
  return `"${name.replace(/"/g, '""')}"`;
}

function sqlLiteral(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (v instanceof Date) return `'${v.toISOString()}'`;
  if (typeof v === "object" && v !== null && "toFixed" in v) return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
}

async function withClient<T>(
  url: string,
  fn: (c: pg.Client) => Promise<T>,
  timeoutMs: number
): Promise<T> {
  const c = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 25_000,
  });
  c.on("error", () => undefined);
  await c.connect();
  try {
    return await Promise.race([
      fn(c),
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error(`timeout ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  } finally {
    await c.end().catch(() => undefined);
  }
}

async function insertRows(
  targetUrl: string,
  table: string,
  rows: Record<string, unknown>[]
) {
  if (!rows.length) {
    console.log(`${table}: 0`);
    return;
  }
  const cols = Object.keys(rows[0]);
  const colList = cols.map(qid).join(", ");
  const batchSize = 25;
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize);
    const valuesSql = batch
      .map(
        (row) =>
          `(${cols.map((col) => sqlLiteral(row[col])).join(", ")})`
      )
      .join(",\n");
    const sql = `INSERT INTO ${qid(table)} (${colList}) VALUES ${valuesSql} ON CONFLICT DO NOTHING`;
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        await withClient(targetUrl, (c) => c.query(sql), 90_000);
        console.log(
          `  ${table} ${Math.min(offset + batch.length, rows.length)}/${rows.length}`
        );
        break;
      } catch (e) {
        console.warn(`  retry ${table}@${offset}:`, (e as Error).message);
        if (attempt === 5) throw e;
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
}

async function readAll(sourceUrl: string, table: string) {
  const rows = await withClient(
    sourceUrl,
    async (c) =>
      (await c.query(`SELECT * FROM ${qid(table)}`)).rows as Record<
        string,
        unknown
      >[],
    120_000
  );
  console.log(`read ${table}: ${rows.length}`);
  return rows;
}

async function main() {
  const sourceUrl = must("DATABASE_URL");
  const targetUrl = toSession(must("NEW_DATABASE_URL"));
  console.log("source", (sourceUrl.match(/@([^/?]+)/) || [])[1]);
  console.log("target", (targetUrl.match(/@([^/?]+)/) || [])[1]);

  const clearOrder = [
    "ChatMessage",
    "Assignment",
    "Booking",
    "Slot",
    "Actor",
    "Quest",
    "User",
  ];
  for (const table of clearOrder) {
    await withClient(
      targetUrl,
      (c) => c.query(`DELETE FROM ${qid(table)}`),
      45_000
    );
    console.log("cleared", table);
  }

  const users = await readAll(sourceUrl, "User");
  const quests = await readAll(sourceUrl, "Quest");
  const actors = await readAll(sourceUrl, "Actor");
  await insertRows(targetUrl, "User", users);
  await insertRows(targetUrl, "Quest", quests);
  await insertRows(targetUrl, "Actor", actors);

  const slots = await withClient(
    sourceUrl,
    async (c) =>
      (
        await c.query(`
          SELECT s.* FROM "Slot" s
          WHERE s."isBooked" = true
             OR EXISTS (SELECT 1 FROM "Booking" b WHERE b."slotId" = s.id)
             OR EXISTS (SELECT 1 FROM "Assignment" a WHERE a."slotId" = s.id)
        `)
      ).rows as Record<string, unknown>[],
    180_000
  );
  console.log(`read Slot (referenced only): ${slots.length}`);
  await insertRows(targetUrl, "Slot", slots);

  const bookings = await readAll(sourceUrl, "Booking");
  const assignments = await readAll(sourceUrl, "Assignment");
  const messages = await readAll(sourceUrl, "ChatMessage");
  await insertRows(targetUrl, "Booking", bookings);
  await insertRows(targetUrl, "Assignment", assignments);
  await insertRows(targetUrl, "ChatMessage", messages);

  console.log("--- counts ---");
  for (const table of [
    "User",
    "Quest",
    "Actor",
    "Slot",
    "Booking",
    "Assignment",
    "ChatMessage",
  ]) {
    const n = await withClient(
      targetUrl,
      async (c) =>
        (
          (await c.query(`SELECT COUNT(*)::int AS n FROM ${qid(table)}`))
            .rows[0] as { n: number }
        ).n,
      30_000
    );
    console.log(`${table}: ${n}`);
  }
  console.log("DONE");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
