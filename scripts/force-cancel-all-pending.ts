import "dotenv/config";
import pg from "pg";

async function main() {
  const c = new pg.Client({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  });
  c.on("error", () => undefined);
  await c.connect();

  const pending = await c.query(`
    SELECT id, status, "createdAt"::text, "expiresAt"::text,
           ("expiresAt" > "createdAt" + INTERVAL '2 hours') AS skew,
           ("expiresAt" <= NOW()) AS expired
    FROM "Booking" WHERE status = 'PENDING'
  `);
  console.log("pending rows", pending.rows);

  const r = await c.query(`
    UPDATE "Booking"
    SET status = 'CANCELLED', "expiresAt" = NULL, "updatedAt" = NOW()
    WHERE status = 'PENDING'
    RETURNING id
  `);
  console.log("force cancelled all PENDING", r.rowCount, r.rows);
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
