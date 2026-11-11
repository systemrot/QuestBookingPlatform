import "dotenv/config";
import pg from "pg";

const url = process.env.DATABASE_URL_TX || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL required");

async function main() {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    const r = await client.query(
      `SELECT email, name, role, (password IS NOT NULL) AS "hasPassword"
       FROM "User" WHERE lower(email) = lower($1)`,
      ["grimjacques@gmail.com"]
    );
    console.log(r.rows[0] ?? "not found");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
