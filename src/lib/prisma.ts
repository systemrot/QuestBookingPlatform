import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  // Support both:
  // - Supabase / standard Postgres URLs: postgresql://... (use pg adapter)
  // - Prisma Postgres dev URLs: prisma+postgres://... (use accelerateUrl passthrough)
  if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
    const adapter = new PrismaPg({ connectionString: url });
    return new PrismaClient({ adapter });
  }

  if (url.startsWith("prisma+postgres://") || url.startsWith("prisma://")) {
    return new PrismaClient({ accelerateUrl: url });
  }

  throw new Error(
    `Unsupported DATABASE_URL protocol. Use postgresql:// (Supabase) or prisma+postgres:// (Prisma dev). Got: ${url.split(":")[0]}:`
  );
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
