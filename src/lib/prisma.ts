import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { PrismaClient } from "@/generated/prisma";

type PrismaGlobal = {
  prisma?: PrismaClient;
  pool?: pg.Pool;
  poolConfigKey?: string;
  resetting?: Promise<void>;
};

const globalForPrisma = globalThis as unknown as PrismaGlobal;

/**
 * Verified against live Supabase TX pooler (scripts/storm-db.ts):
 * - long-lived reuse → ECONNRESET / "timeout exceeded"
 * - maxUses:5 + keepAlive → 20/20 OK in ~2.5s
 */
const POOL_CONFIG_KEY = "tx6543-maxUses5-v9-booking-note";

function normalizeDatabaseUrl(raw: string): string {
  try {
    const u = new URL(raw);
    if (u.port === "5432" && u.hostname.includes("pooler.supabase.com")) {
      u.port = "6543";
    }
    u.searchParams.set("pgbouncer", "true");
    u.searchParams.set("sslmode", "no-verify");
    u.searchParams.delete("options");
    return u.toString();
  } catch {
    return raw;
  }
}

function createPgPool(url: string) {
  const pool = new pg.Pool({
    connectionString: normalizeDatabaseUrl(url),
    max: 3,
    // Recycle before Supabase/pooler silently drops the socket.
    maxUses: 5,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 8_000,
    allowExitOnIdle: true,
    keepAlive: true,
    keepAliveInitialDelayMillis: 5_000,
  });

  pool.on("error", (err) => {
    console.error("[db] idle client error:", err.message);
  });

  return pool;
}

async function resetPrismaPool() {
  if (globalForPrisma.resetting) {
    await globalForPrisma.resetting;
    return;
  }

  globalForPrisma.resetting = (async () => {
    const old = globalForPrisma.pool;
    globalForPrisma.prisma = undefined;
    globalForPrisma.pool = undefined;
    globalForPrisma.poolConfigKey = undefined;
    if (old) {
      try {
        await Promise.race([
          old.end(),
          new Promise((r) => setTimeout(r, 1200)),
        ]);
      } catch {
        // ignore
      }
    }
  })();

  try {
    await globalForPrisma.resetting;
  } finally {
    globalForPrisma.resetting = undefined;
  }
}

function getDatabaseUrl(): string {
  const preferred =
    process.env.DATABASE_URL_TX ||
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_SESSION;
  if (!preferred) throw new Error("DATABASE_URL is not set");
  return preferred;
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (
    cached &&
    globalForPrisma.poolConfigKey === POOL_CONFIG_KEY &&
    // После prisma generate старый singleton без новых моделей — пересоздаём.
    typeof (cached as { city?: unknown }).city !== "undefined"
  ) {
    return cached;
  }

  const url = getDatabaseUrl();

  if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
    if (globalForPrisma.pool) {
      void globalForPrisma.pool.end().catch(() => undefined);
      globalForPrisma.pool = undefined;
    }
    const pool = createPgPool(url);
    globalForPrisma.pool = pool;
    globalForPrisma.poolConfigKey = POOL_CONFIG_KEY;
    globalForPrisma.prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    return globalForPrisma.prisma;
  }

  if (url.startsWith("prisma+postgres://") || url.startsWith("prisma://")) {
    globalForPrisma.poolConfigKey = POOL_CONFIG_KEY;
    globalForPrisma.prisma = new PrismaClient({ accelerateUrl: url });
    return globalForPrisma.prisma;
  }

  throw new Error(
    `Unsupported DATABASE_URL protocol. Use postgresql:// (Supabase) or prisma+postgres:// (Prisma dev). Got: ${url.split(":")[0]}:`
  );
}

function isDbConnectionError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);

  const lower = message.toLowerCase();
  return (
    lower.includes("connection terminated") ||
    lower.includes("connection closed") ||
    lower.includes("database_not_reachable") ||
    lower.includes("can't reach database") ||
    lower.includes("connection timeout") ||
    lower.includes("timeout exceeded") ||
    lower.includes("query timeout") ||
    lower.includes("statement timeout") ||
    lower.includes("canceling statement") ||
    lower.includes("econnreset") ||
    lower.includes("socket hang up") ||
    lower.includes("pool after calling end") ||
    lower.includes("emaxconnsession") ||
    lower.includes("max clients reached") ||
    lower.includes("too many connections") ||
    lower.includes("client was closed") ||
    lower.includes("cannot use a pool after") ||
    lower.includes("remaining connection slots") ||
    lower.includes("not queryable") ||
    lower.includes("connection error")
  );
}

export async function withDbRetry<T>(
  operation: () => Promise<T>,
  attempts = 3
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isDbConnectionError(error) || attempt === attempts - 1) {
        throw error;
      }
      console.warn(
        `[db] retry ${attempt + 1}/${attempts - 1}:`,
        error instanceof Error ? error.message : error
      );
      await resetPrismaPool();
      await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
    }
  }

  throw lastError;
}

export function db<T>(operation: (client: PrismaClient) => Promise<T>): Promise<T> {
  return withDbRetry(() => operation(getPrismaClient()));
}

export function dbUrgent<T>(
  operation: (client: PrismaClient) => Promise<T>
): Promise<T> {
  return db(operation);
}

export function warmDatabase() {
  void db((client) => client.$queryRaw`SELECT 1`).catch((error) => {
    console.error("[db] warm failed:", error);
  });
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
