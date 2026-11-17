/**
 * Import scraped VK quests into DB.
 * Run: npx tsx scripts/import-vk-quests.ts
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma";

type CitySlug = "oryol" | "smolensk";

type ScrapedQuest = {
  title: string;
  price: number;
  image: string;
  imageAlt: string;
  cities: CitySlug[];
  description: string;
};

const url = process.env.DATABASE_URL_TX || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL required");

async function main() {
  const file = path.join(process.cwd(), "scripts/vk-scraped-quests.json");
  const quests = JSON.parse(fs.readFileSync(file, "utf8")) as ScrapedQuest[];

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });

  try {
    const cities = await prisma.city.findMany({
      select: { id: true, slug: true },
    });
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
          select: { id: true, image: true },
        });
        if (existing) {
          await prisma.quest.update({
            where: { id: existing.id },
            data: {
              description: q.description,
              price: q.price,
              imageAlt: q.imageAlt,
              // keep existing image if already set; otherwise set scraped
              image: existing.image || q.image,
            },
          });
          console.log("updated", slug, q.title);
        } else {
          await prisma.quest.create({
            data: {
              title: q.title,
              description: q.description,
              price: q.price,
              image: q.image,
              imageAlt: q.imageAlt,
              cityId,
            },
          });
          console.log("created", slug, q.title);
        }
      }
    }

    const counts = await prisma.quest.groupBy({
      by: ["cityId"],
      _count: true,
    });
    console.log("counts", counts);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
