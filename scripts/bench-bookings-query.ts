/**
 * Замер чтения броней пользователя (как /bookings).
 */
import "dotenv/config";
import pg from "pg";

async function main() {
  const url = process.env.DATABASE_URL!;
  console.log("host", (url.match(/@([^/?]+)/) || [])[1]);

  const pool = new pg.Pool({
    connectionString: url,
    max: 3,
    idleTimeoutMillis: 8_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
    keepAlive: true,
    ssl: { rejectUnauthorized: false },
  });

  const user = await pool.query(
    `SELECT id FROM "User" WHERE email = 'user@example.com' LIMIT 1`
  );
  const userId = user.rows[0]?.id as string;
  if (!userId) throw new Error("user not found");

  for (let i = 0; i < 3; i++) {
    const t0 = Date.now();
    const r = await pool.query(
      `SELECT b.id, b.status, b."expiresAt"
       FROM "Booking" b WHERE b."userId" = $1
       ORDER BY b."createdAt" DESC`,
      [userId]
    );
    console.log(`query ${i + 1}: ${Date.now() - t0}ms rows=${r.rowCount}`);
  }

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
