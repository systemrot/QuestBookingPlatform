/**
 * Выдать роль OWNER существующему пользователю по email.
 * Run: npx tsx scripts/grant-owner.ts you@email.com
 */
import "dotenv/config";
import pg from "pg";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: npx tsx scripts/grant-owner.ts you@email.com");
  process.exit(1);
}

const url = process.env.DATABASE_URL_TX || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL required");

async function main() {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    const r = await client.query(
      `UPDATE "User"
       SET role = 'OWNER', "updatedAt" = NOW()
       WHERE lower(email) = $1
       RETURNING id, email, name, role`,
      [email]
    );
    if (r.rowCount === 0) {
      console.error("User not found:", email);
      process.exit(1);
    }
    console.log("granted OWNER:", r.rows[0]);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
