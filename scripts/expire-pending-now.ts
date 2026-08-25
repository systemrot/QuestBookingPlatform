import "dotenv/config";
import pg from "pg";

async function main() {
  const c = new pg.Client({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  });
  c.on("error", () => undefined);
  await c.connect();
  const r = await c.query(`
    UPDATE "Booking"
    SET status = 'CANCELLED', "expiresAt" = NULL, "updatedAt" = NOW()
    WHERE status = 'PENDING'
      AND (
        ("expiresAt" IS NOT NULL AND "expiresAt" <= NOW())
        OR ("expiresAt" IS NULL AND "createdAt" <= NOW() - INTERVAL '20 minutes')
      )
    RETURNING id
  `);
  console.log("expired cancelled:", r.rowCount);
  const p = await c.query(
    `SELECT COUNT(*)::int AS n FROM "Booking" WHERE status = 'PENDING'`
  );
  console.log("remaining PENDING:", p.rows[0].n);
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
