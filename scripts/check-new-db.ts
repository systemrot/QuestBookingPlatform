import "dotenv/config";
import dns from "dns/promises";
import pg from "pg";

async function tryDns(h: string) {
  try {
    const a = await dns.lookup(h, { all: true });
    console.log(
      `DNS ${h}:`,
      a.map((x) => `${x.address} (v${x.family})`).join(", ")
    );
  } catch (e) {
    console.log(`DNS ${h}:`, (e as NodeJS.ErrnoException).code);
  }
}

async function tryConn(label: string, url: string) {
  const c = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20_000,
  });
  try {
    await c.connect();
    await c.query("select 1 as ok");
    console.log(`${label}: OK`);
    await c.end();
    return true;
  } catch (e) {
    console.log(`${label}: FAIL`, (e as Error).message);
    try {
      await c.end();
    } catch {
      /* ignore */
    }
    return false;
  }
}

async function main() {
  const neu = process.env.NEW_DATABASE_URL!;
  const m = neu.match(/postgres\.([^:]+):([^@]+)@([^:]+):(\d+)/);
  if (!m) {
    console.error("Cannot parse NEW_DATABASE_URL");
    process.exit(1);
  }
  const [, ref, , host, port] = m;
  console.log(`ref=${ref} pooler=${host}:${port}`);

  await tryDns(`db.${ref}.supabase.co`);
  await tryDns(host);
  await tryConn("transaction-6543", neu);

  const session = neu
    .replace(":6543/", ":5432/")
    .replace("?pgbouncer=true&sslmode=no-verify", "?sslmode=no-verify")
    .replace("pgbouncer=true&", "")
    .replace("pgbouncer=true", "");
  await tryConn("session-5432", session);

  const direct = process.env.NEW_DIRECT_URL!;
  await tryConn("direct-env", direct);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
