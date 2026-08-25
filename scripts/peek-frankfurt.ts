import "dotenv/config";
import pg from "pg";

function toSession(url: string) {
  return url
    .replace(":6543/", ":5432/")
    .replace("?pgbouncer=true&sslmode=no-verify", "?sslmode=no-verify")
    .replace("pgbouncer=true&", "")
    .replace("pgbouncer=true", "");
}

async function q(url: string, sql: string) {
  const c = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15_000,
  });
  c.on("error", () => undefined);
  await c.connect();
  try {
    const r = await Promise.race([
      c.query(sql),
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error("timeout")), 20_000)
      ),
    ]);
    return r;
  } finally {
    await c.end().catch(() => undefined);
  }
}

async function main() {
  const url = toSession(process.env.NEW_DATABASE_URL!);
  console.log("target", (url.match(/@([^/?]+)/) || [])[1]);

  for (const sql of [
    `SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1`,
    `SELECT COUNT(*)::int AS n FROM "User"`,
    `SELECT COUNT(*)::int AS n FROM "Quest"`,
    `SELECT COUNT(*)::int AS n FROM "Slot"`,
  ]) {
    try {
      const r = await q(url, sql);
      console.log(sql.slice(0, 50), "=>", r.rows);
    } catch (e) {
      console.log(sql.slice(0, 50), "FAIL", (e as Error).message);
    }
  }
}

main();
