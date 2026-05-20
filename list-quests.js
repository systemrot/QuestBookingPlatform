require("dotenv/config");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("./src/generated/prisma");

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL missing");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

(async () => {
  const quests = await prisma.quest.findMany({
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  console.log("Quests in DB:");
  for (const q of quests) console.log(`${q.id} | ${q.title}`);

  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  try { await prisma.$disconnect(); } catch {}
  process.exit(1);
});
