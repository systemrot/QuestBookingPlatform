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
        "expiresAt" IS NULL
        OR "expiresAt" <= NOW()
        OR "expiresAt" > "createdAt" + INTERVAL '2 hours'
      )
    RETURNING id, "userId", "createdAt", "expiresAt"
  `);
  console.log("cancelled", r.rowCount, r.rows);

  const left = await c.query(
    `SELECT COUNT(*)::int AS n FROM "Booking" WHERE status = 'PENDING'`
  );
  console.log("PENDING left", left.rows[0].n);
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
