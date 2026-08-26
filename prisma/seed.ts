import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma";

function getDatabaseUrl(): string {
  const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL or DIRECT_URL is required for seeding");
  }
  return connectionString;
}

function createPrismaClient() {
  const url = getDatabaseUrl();
  return url.startsWith("postgresql://") || url.startsWith("postgres://")
    ? new PrismaClient({
        adapter: new PrismaPg({ connectionString: url }),
      })
    : new PrismaClient({ accelerateUrl: url });
}

async function withPrisma<T>(fn: (client: PrismaClient) => Promise<T>) {
  const client = createPrismaClient();
  try {
    return await fn(client);
  } finally {
    await client.$disconnect();
  }
}

const QUEST_DEFS = [
  {
    previousTitles: ["Потерянная крипта", "Не дыши", "The Lost Crypt"],
    title: "Не дыши",
    description:
      "Группе друзей с мелкокриминальными наклонностями дали задание забраться в старую мебельную фабрику. Владельцем ее был слепой старик… Забраться им нужно с целью украсть немалую сумму денег, которая по слухам спрятана где-то внутри. Казалось бы, что может быть проще, чем вынести деньги беспомощного слепого инвалида, но грабители очень сильно ошибаются, и вот уже жертва становится преследователем…",
    image: "/Dyshi.jpg",
    price: 6489.99,
  },
  {
    previousTitles: [
      "Кибер-ограбление 2084",
      "Ключ от всех дверей",
      "Cyber Heist 2084",
    ],
    title: "Ключ от всех дверей",
    description: `Вы работники социальной службы. Вас отправили к пожилому инвалиду Бэну Дэвиро - владельцу огромного особняка, неподалеку от Луизианы…
Однажды, вы обнаруживаете на чердаке секретную комнату с массой мистических предметов. Хозяин утверждает, что вещи принадлежат бывшим владельцам, которые занимались магией. 🪄
Вскоре вы становитесь свидетелями довольно странных и необъяснимых событий и перед вами запираются все двери… `,
    image: "/Kluch.jpg",
    price: 5489.99,
  },
  {
    previousTitles: [
      "Пиратская бухта",
      "Поворот не туда",
      "Pirate's Cove",
      "Pirate’s Cove",
    ],
    title: "Поворот не туда",
    description: `– Приемная шерифа Джима Хокинса, говорите!
– Свяжите меня с шерифом, срочно!
– Мэм, представьтесь, пожалуйста!
– Тут повсюду кровь и ужасная вонь! О нет! Я... Я вижу людей... Мертвых людей!
– Расскажите, где вы находитесь?
– Я не знаю, где я, мне очень страшно! Он отрубил мне ноги, я не могу двигаться.
– Мэм, я вас не понимаю, кто он?
– Какой-то урод! Он взял мою ногу и начал ее есть! Он идет… мне очень страшно…помогите… Аааа…аааа…
– Мэм, алло! Не вешайте трубку… Алло…`,
    image: "/Povorot.jpg",
    price: 6489.99,
  },
] as const;

const ACTORS_BY_CITY: Record<string, { name: string; hourlyRate: number }[]> = {
  oryol: [
    { name: "Игорь Блейк", hourlyRate: 35 },
    { name: "Мария Кросс", hourlyRate: 40 },
    { name: "Илья Стоун", hourlyRate: 32 },
  ],
  smolensk: [
    { name: "Артём Волков", hourlyRate: 35 },
    { name: "Елена Норова", hourlyRate: 40 },
    { name: "Дмитрий Серов", hourlyRate: 33 },
  ],
};

async function main() {
  const passwordHash = bcrypt.hashSync("password", 10);

  await withPrisma(async (prisma) => {
    await prisma.user.upsert({
      where: { email: "user@example.com" },
      update: { password: passwordHash },
      create: {
        email: "user@example.com",
        name: "Алексей Игрок",
        password: passwordHash,
        role: "USER",
        age: 28,
      },
    });

    await prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: { password: passwordHash },
      create: {
        email: "admin@example.com",
        name: "Админ Квестов",
        password: passwordHash,
        role: "ADMIN",
      },
    });
  });

  const cities = await withPrisma(async (prisma) => {
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
    return [oryol, smolensk];
  });

  const { listScheduleStarts, slotEndTime } = await import(
    "../src/lib/booking-policy"
  );
  const starts = listScheduleStarts(new Date());

  for (const city of cities) {
    const seededQuestIds: string[] = [];

    for (const q of QUEST_DEFS) {
      const quest = await withPrisma(async (prisma) => {
        const existing = await prisma.quest.findFirst({
          where: {
            cityId: city.id,
            title: { in: [...q.previousTitles] },
          },
          orderBy: { updatedAt: "desc" },
        });
        if (existing) {
          return prisma.quest.update({
            where: { id: existing.id },
            data: {
              title: q.title,
              description: q.description,
              image: q.image,
              price: q.price,
              cityId: city.id,
            },
          });
        }
        return prisma.quest.create({
          data: {
            title: q.title,
            description: q.description,
            image: q.image,
            price: q.price,
            cityId: city.id,
          },
        });
      });
      seededQuestIds.push(quest.id);
    }

    await withPrisma(async (prisma) => {
      await prisma.quest.deleteMany({
        where: {
          cityId: city.id,
          title: {
            in: [
              "The Lost Crypt",
              "Cyber Heist 2084",
              "Pirate's Cove",
              "Pirate’s Cove",
            ],
          },
          id: { notIn: seededQuestIds },
        },
      });

      const seededSlots = await prisma.slot.findMany({
        where: { questId: { in: seededQuestIds } },
        select: { id: true },
      });
      if (seededSlots.length > 0) {
        const seededSlotIds = seededSlots.map((s) => s.id);
        await prisma.assignment.deleteMany({
          where: { slotId: { in: seededSlotIds } },
        });
        await prisma.booking.deleteMany({
          where: { slotId: { in: seededSlotIds } },
        });
        await prisma.slot.deleteMany({ where: { id: { in: seededSlotIds } } });
      }

      const questRows = await prisma.quest.findMany({
        where: { id: { in: seededQuestIds } },
        select: { id: true, price: true },
      });
      for (const q of questRows) {
        if (starts.length === 0) continue;
        await prisma.slot.createMany({
          data: starts.map((start) => ({
            questId: q.id,
            startTime: start,
            endTime: slotEndTime(start),
            price: q.price,
            isBooked: false,
          })),
          skipDuplicates: true,
        });
      }

      const actorDefs = ACTORS_BY_CITY[city.slug] ?? [];
      const names = actorDefs.map((a) => a.name);
      await prisma.actor.deleteMany({
        where: { cityId: city.id, name: { in: names } },
      });
      if (actorDefs.length > 0) {
        await prisma.actor.createMany({
          data: actorDefs.map((a) => ({
            name: a.name,
            hourlyRate: a.hourlyRate,
            cityId: city.id,
          })),
        });
      }
    });
  }

  // Старые актёры без привязки к Смоленску уже в Орле после миграции;
  // подчистим дубликаты орловских имён вне seed-списка не трогаем.
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
