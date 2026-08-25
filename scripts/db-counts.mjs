import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  ssl: { rejectUnauthorized: false },
});

const quests = await pool.query('SELECT COUNT(*)::int AS n FROM "Quest"');
console.log("quests:", quests.rows[0].n);

const users = await pool.query('SELECT COUNT(*)::int AS n FROM "User"');
console.log("users:", users.rows[0].n);

await pool.end();
