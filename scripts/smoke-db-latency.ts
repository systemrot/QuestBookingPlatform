import "dotenv/config";
import pg from "pg";

async function main() {
  const u = process.env.DATABASE_URL!;
  console.log("host", (u.match(/@([^/?]+)/) || [])[1]);
  const c = new pg.Client({
    connectionString: u,
    ssl: { rejectUnauthorized: false },
  });
  c.on("error", () => undefined);
  const t0 = Date.now();
  await c.connect();
  const t1 = Date.now();
  const r = await c.query(`SELECT COUNT(*)::int AS n FROM "User"`);
  const t2 = Date.now();
  console.log("connect_ms", t1 - t0, "query_ms", t2 - t1, "users", r.rows[0].n);
  await c.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
