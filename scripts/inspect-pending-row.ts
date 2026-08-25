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
    SELECT
      id,
      status,
      "expiresAt",
      "expiresAt"::text AS exp_text,
      NOW()::text AS now_text,
      current_setting('TIMEZONE') AS tz,
      ("expiresAt" <= NOW()) AS exp_lte_now,
      ("expiresAt" > NOW()) AS exp_gt_now,
      pg_typeof("expiresAt")::text AS exp_type
    FROM "Booking"
    WHERE id = '02bfc058-dead-42cc-a696-b1a51bd874cf'
  `);
  console.log(r.rows[0]);

  const force = await c.query(`
    UPDATE "Booking"
    SET status = 'CANCELLED', "expiresAt" = NULL, "updatedAt" = NOW()
    WHERE id = '02bfc058-dead-42cc-a696-b1a51bd874cf'
    RETURNING id, status
  `);
  console.log("force cancel", force.rows);

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
