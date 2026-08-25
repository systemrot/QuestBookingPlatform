import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const check = await pool.query(`
    SELECT is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'password'
  `);

  if (check.rows.length === 0) {
    throw new Error('Column "User"."password" not found');
  }

  if (check.rows[0].is_nullable === "YES") {
    console.log("OK: User.password is already nullable");
    return;
  }

  await pool.query('ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL');
  console.log("OK: User.password is now nullable");
}

main()
  .catch((error) => {
    console.error("FAILED:", error.message);
    process.exit(1);
  })
  .finally(() => pool.end());
