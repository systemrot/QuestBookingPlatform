import "dotenv/config";
import pg from "pg";

const url = process.env.DATABASE_URL_TX || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL required");

async function main() {
  const client = new pg.Client({
    connectionString: url,
    connectionTimeoutMillis: 20_000,
    statement_timeout: 60_000,
  });
  client.on("error", () => undefined);
  await client.connect();
  try {
    await client.query(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'OWNER'`);
    console.log("ok: Role.OWNER");
  } finally {
    await client.end().catch(() => undefined);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
