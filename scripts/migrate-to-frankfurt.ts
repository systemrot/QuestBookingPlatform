/**
 * Схема + данные → Frankfurt.
 * Каждое DDL — новое соединение (session pooler иначе зависает).
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
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

function must(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

function toSessionUrl(url: string) {
  if (url.includes(":6543/")) {
    return url
      .replace(":6543/", ":5432/")
      .replace("?pgbouncer=true&sslmode=no-verify", "?sslmode=no-verify")
      .replace("pgbouncer=true&", "")
      .replace("pgbouncer=true", "");
  }
  return url;
}

function qid(name: string) {
  return `"${name.replace(/"/g, '""')}"`;
}

async function withClient<T>(
  url: string,
  fn: (c: pg.Client) => Promise<T>,
  timeoutMs = 45_000
): Promise<T> {
  const c = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20_000,
  });
  await c.connect();
  try {
    const result = await Promise.race([
      fn(c),
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error(`query timeout ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
    return result;
  } finally {
    await c.end().catch(() => undefined);
  }
}

function schemaStatements(): string[] {
  const sql = fs.readFileSync(
    path.join(process.cwd(), "scripts", "frankfurt-schema.sql"),
    "utf8"
  );
  return sql
    .split(/;\s*\n/)
    .map((s) =>
      s
        .split("\n")
        .filter((line) => !/^\s*--/.test(line))
        .join("\n")
        .trim()
    )
    .filter(Boolean)
    .map((p) => (p.endsWith(";") ? p : `${p};`));
}

async function applySchema(targetUrl: string) {
  for (const stmt of schemaStatements()) {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await withClient(targetUrl, (c) => c.query(stmt), 60_000);
        console.log("ok:", stmt.slice(0, 70).replace(/\s+/g, " "));
        break;
      } catch (e) {
        const msg = (e as Error).message;
        const code = (e as { code?: string }).code;
        if (
          msg.includes("already exists") ||
          code === "42P07" ||
          code === "42710"
        ) {
          console.log("skip:", stmt.slice(0, 56).replace(/\s+/g, " "));
          break;
        }
        console.warn(`retry DDL (${attempt + 1}):`, msg);
        if (attempt === 4) throw e;
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  console.log("schema done");
}

async function copyTable(
  sourceUrl: string,
  targetUrl: string,
  table: (typeof TABLES)[number]
) {
  const rows = await withClient(
    sourceUrl,
    async (c) => (await c.query(`SELECT * FROM ${qid(table)}`)).rows,
    120_000
  );
  console.log(`${table}: read ${rows.length}`);
  if (rows.length === 0) return;

  const cols = Object.keys(rows[0] as object);
  const colList = cols.map(qid).join(", ");

  // батчами по 25, каждое соединение — один батч
  const batchSize = 25;
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize);
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await withClient(targetUrl, async (c) => {
          await c.query("BEGIN");
          try {
            for (const row of batch) {
              const values = cols.map((col) => (row as Record<string, unknown>)[col]);
              const ph = values.map((_, i) => `$${i + 1}`).join(", ");
              await c.query(
                `INSERT INTO ${qid(table)} (${colList}) VALUES (${ph})
                 ON CONFLICT DO NOTHING`,
                values
              );
            }
            await c.query("COMMIT");
          } catch (e) {
            await c.query("ROLLBACK");
            throw e;
          }
        }, 90_000);
        console.log(
          `  ${table} wrote ${Math.min(offset + batch.length, rows.length)}/${rows.length}`
        );
        break;
      } catch (e) {
        console.warn(`retry insert ${table} @${offset}:`, (e as Error).message);
        if (attempt === 4) throw e;
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
}

async function main() {
  const sourceUrl = must("DIRECT_URL", process.env.DATABASE_URL);
  const targetUrl = toSessionUrl(must("NEW_DATABASE_URL"));

  console.log("source:", (sourceUrl.match(/@([^/?]+)/) || [])[1]);
  console.log("target:", (targetUrl.match(/@([^/?]+)/) || [])[1]);

  await applySchema(targetUrl);

  // очистка перед копией (идемпотентный повтор)
  await withClient(targetUrl, (c) =>
    c.query(
      "TRUNCATE TABLE " +
        TABLES.map(qid).join(", ") +
        " RESTART IDENTITY CASCADE"
    )
  );
  console.log("truncated ok");

  for (const table of TABLES) {
    await copyTable(sourceUrl, targetUrl, table);
  }

  console.log("--- counts ---");
  for (const table of TABLES) {
    const n = await withClient(
      targetUrl,
      async (c) =>
        ((await c.query(`SELECT COUNT(*)::int AS n FROM ${qid(table)}`))
          .rows[0] as { n: number }).n
    );
    console.log(`${table}: ${n}`);
  }
  console.log("DONE");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
