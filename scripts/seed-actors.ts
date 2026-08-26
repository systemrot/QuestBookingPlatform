import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });

  try {
    const oryol = await prisma.city.upsert({
      where: { slug: "oryol" },
      update: { name: "Орёл" },
      create: { id: "c_oryol", slug: "oryol", name: "Орёл" },
    });
    const smolensk = await prisma.city.upsert({
      where: { slug: "smolensk" },
      update: { name: "Смоленск" },
      create: { id: "c_smolensk", slug: "smolensk", name: "Смоленск" },
    });

    const oryolActors = [
      { name: "Игорь Блейк", hourlyRate: 35 },
      { name: "Мария Кросс", hourlyRate: 40 },
      { name: "Илья Стоун", hourlyRate: 32 },
    ];
    const smolenskActors = [
      { name: "Артём Волков", hourlyRate: 35 },
      { name: "Елена Норова", hourlyRate: 40 },
      { name: "Дмитрий Серов", hourlyRate: 33 },
    ];

    for (const a of oryolActors) {
      const exists = await prisma.actor.findFirst({
        where: { cityId: oryol.id, name: a.name },
      });
      if (!exists) {
        await prisma.actor.create({
          data: { ...a, cityId: oryol.id },
        });
      }
    }
    for (const a of smolenskActors) {
      const exists = await prisma.actor.findFirst({
        where: { cityId: smolensk.id, name: a.name },
      });
      if (!exists) {
        await prisma.actor.create({
          data: { ...a, cityId: smolensk.id },
        });
      }
    }

    const rows = await prisma.actor.findMany({
      select: { name: true, city: { select: { name: true } } },
      orderBy: [{ city: { name: "asc" } }, { name: "asc" }],
    });
    console.log(
      "actors:",
      rows.map((r) => `${r.city.name}: ${r.name}`).join(" | ")
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
