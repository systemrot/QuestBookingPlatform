/**
 * Upsert local demo OWNER: owner@example.com / password
 * Run: npx tsx scripts/ensure-owner-demo.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";

const url = process.env.DATABASE_URL_TX || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL required");

function cuidLike() {
  return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

async function main() {
  const passwordHash = bcrypt.hashSync("password", 10);
  const client = new pg.Client({
    connectionString: url,
    connectionTimeoutMillis: 20_000,
  });
  await client.connect();
  try {
    const r = await client.query(
      `INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt")
       VALUES ($1, 'Owner Demo', 'owner@example.com', $2, 'OWNER', NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET
         password = EXCLUDED.password,
         role = 'OWNER',
         name = EXCLUDED.name,
         "updatedAt" = NOW()
       RETURNING id, email, name, role`,
      [cuidLike(), passwordHash]
    );
    console.log("ok:", r.rows[0]);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
