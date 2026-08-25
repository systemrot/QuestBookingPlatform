/**
 * Диагностика: активные PENDING у пользователей.
 * npx tsx scripts/debug-pending-holds.ts
 */
import "dotenv/config";
import pg from "pg";

async function main() {
  const url = process.env.DATABASE_URL!;
  const c = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  c.on("error", () => undefined);
  await c.connect();

  const now = new Date();
  console.log("now", now.toISOString());
  console.log("host", (url.match(/@([^/?]+)/) || [])[1]);

  const pending = await c.query(`
    SELECT b.id, b.status, b."expiresAt", b."createdAt", b."userId",
           u.email, s."startTime", q.title
    FROM "Booking" b
    JOIN "User" u ON u.id = b."userId"
    JOIN "Slot" s ON s.id = b."slotId"
    JOIN "Quest" q ON q.id = s."questId"
    WHERE b.status = 'PENDING'
    ORDER BY b."createdAt" DESC
  `);
  console.log("PENDING count:", pending.rows.length);
  for (const r of pending.rows) {
    const exp = r.expiresAt ? new Date(r.expiresAt) : null;
    const active = !exp || exp.getTime() > now.getTime();
    console.log({
      email: r.email,
      id: r.id,
      expiresAt: exp?.toISOString() ?? null,
      active,
      createdAt: new Date(r.createdAt).toISOString(),
      quest: r.title,
      start: new Date(r.startTime).toISOString(),
    });
  }

  const byUser = await c.query(`
    SELECT u.email, b.status, COUNT(*)::int AS n
    FROM "Booking" b
    JOIN "User" u ON u.id = b."userId"
    GROUP BY u.email, b.status
    ORDER BY u.email, b.status
  `);
  console.log("by user/status:", byUser.rows);

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
