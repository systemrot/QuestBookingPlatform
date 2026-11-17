/**
 * Import remaining VK services for Oryol + Smolensk.
 * Run: node scripts/import-vk-remaining.mjs
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/index.js";

const url = process.env.DATABASE_URL_TX || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL required");

const quests = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "scripts/vk-remaining-quests.json"), "utf8"),
);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

try {
  const cities = await prisma.city.findMany({ select: { id: true, slug: true } });
  const bySlug = new Map(cities.map((c) => [c.slug, c.id]));

  for (const q of quests) {
    for (const slug of q.cities) {
      const cityId = bySlug.get(slug);
      if (!cityId) {
        console.warn("skip: city missing", slug, q.title);
        continue;
      }

      const existing = await prisma.quest.findUnique({
        where: { cityId_title: { cityId, title: q.title } },
        select: { id: true, image: true, sortOrder: true },
      });

      if (existing) {
        await prisma.quest.update({
          where: { id: existing.id },
          data: {
            description: q.description,
            price: q.price,
            imageAlt: q.imageAlt,
            image: existing.image || q.image,
          },
        });
        console.log("updated", slug, q.title);
      } else {
        const agg = await prisma.quest.aggregate({
          where: { cityId, archivedAt: null },
          _max: { sortOrder: true },
        });
        const sortOrder = (agg._max.sortOrder ?? -1) + 1;
        await prisma.quest.create({
          data: {
            title: q.title,
            description: q.description,
            price: q.price,
            image: q.image,
            imageAlt: q.imageAlt,
            cityId,
            sortOrder,
          },
        });
        console.log("created", slug, q.title, "sortOrder", sortOrder);
      }
    }
  }

  // Smolensk VK lists Не дыши at 6490
  const smolenskId = bySlug.get("smolensk");
  if (smolenskId) {
    const r = await prisma.quest.updateMany({
      where: { cityId: smolenskId, title: "Не дыши" },
      data: { price: 6490 },
    });
    console.log("smolensk Не дыши price→6490", r.count);
  }

  const rows = await prisma.quest.findMany({
    include: { city: true },
    orderBy: [{ city: { name: "asc" } }, { sortOrder: "asc" }],
  });
  for (const q of rows) {
    console.log(
      [q.city.slug, q.sortOrder, q.archivedAt ? "ARCH" : "live", q.price, q.title].join("\t"),
    );
  }
} finally {
  await prisma.$disconnect();
}
