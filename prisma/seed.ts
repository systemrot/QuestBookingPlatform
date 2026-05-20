import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required for seeding");
}

const prisma =
  url.startsWith("postgresql://") || url.startsWith("postgres://")
    ? new PrismaClient({
        adapter: new PrismaPg({ connectionString: url }),
      })
    : new PrismaClient({ accelerateUrl: url });

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function atHour(base: Date, hour: number, minute = 0) {
  const x = new Date(base);
  x.setHours(hour, minute, 0, 0);
  return x;
}

async function main() {
  const hash = (p: string) => bcrypt.hashSync(p, 10);

  await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: { password: hash("password") },
    create: {
      email: "user@example.com",
      name: "Алексей Игрок",
      password: hash("password"),
      role: "USER",
      age: 28,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { password: hash("password") },
    create: {
      email: "admin@example.com",
      name: "Админ Квестов",
      password: hash("password"),
      role: "ADMIN",
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const quests = [
    {
      title: "Не дыши",
      description:
        "Группе друзей с мелкокриминальными наклонностями дали задание забраться в старую мебельную фабрику. Владельцем ее был слепой старик… Забраться им нужно с целью украсть немалую сумму денег, которая по слухам спрятана где-то внутри. Казалось бы, что может быть проще, чем вынести деньги беспомощного слепого инвалида, но грабители очень сильно ошибаются, и вот уже жертва становится преследователем…",
      image: "Dyshi",
      price: 6489.99,
      slotHours: [10, 14, 18] as const,
    },
    {
      title: "Ключ от всех дверей",
      description:
        `Вы работники социальной службы. Вас отправили к пожилому инвалиду Бэну Дэвиро - владельцу огромного особняка, неподалеку от Луизианы…
Однажды, вы обнаруживаете на чердаке секретную комнату с массой мистических предметов. Хозяин утверждает, что вещи принадлежат бывшим владельцам, которые занимались магией. 🪄
Вскоре вы становитесь свидетелями довольно странных и необъяснимых событий и перед вами запираются все двери… `,
      image: "Kluch.jpg",
      price: 5489.99,
      slotHours: [11, 15, 19] as const,
    },
    {
      title: "Поворот не туда",
      description:
        `– Приемная шерифа Джима Хокинса, говорите!
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
      slotHours: [9, 17] as const,
    },
  ];

  const seededQuestIds: string[] = [];
  for (const q of quests) {
    const existing = await prisma.quest.findFirst({ where: { title: q.title } });
    const quest = existing
      ? await prisma.quest.update({
          where: { id: existing.id },
          data: {
            description: q.description,
            image: q.image,
            price: q.price,
          },
        })
      : await prisma.quest.create({
          data: {
            title: q.title,
            description: q.description,
            image: q.image,
            price: q.price,
          },
        });
    seededQuestIds.push(quest.id);
  }

  // Reset seeded slots so script stays deterministic.
  const seededSlots = await prisma.slot.findMany({
    where: { questId: { in: seededQuestIds } },
    select: { id: true },
  });
  if (seededSlots.length > 0) {
    const seededSlotIds = seededSlots.map((s) => s.id);
    await prisma.assignment.deleteMany({ where: { slotId: { in: seededSlotIds } } });
    await prisma.booking.deleteMany({ where: { slotId: { in: seededSlotIds } } });
    await prisma.slot.deleteMany({ where: { id: { in: seededSlotIds } } });
  }

  // Create exactly 10 open slots distributed across 3 quests for next 7 days.
  const slotBlueprints = [
    { dayOffset: 0, hour: 10, questIndex: 0 },
    { dayOffset: 0, hour: 15, questIndex: 1 },
    { dayOffset: 1, hour: 11, questIndex: 2 },
    { dayOffset: 1, hour: 17, questIndex: 0 },
    { dayOffset: 2, hour: 10, questIndex: 1 },
    { dayOffset: 2, hour: 18, questIndex: 2 },
    { dayOffset: 3, hour: 12, questIndex: 0 },
    { dayOffset: 4, hour: 16, questIndex: 1 },
    { dayOffset: 5, hour: 13, questIndex: 2 },
    { dayOffset: 6, hour: 19, questIndex: 0 },
  ] as const;

  for (const blueprint of slotBlueprints) {
    const quest = quests[blueprint.questIndex];
    const questRecord = await prisma.quest.findFirst({ where: { title: quest.title } });
    if (!questRecord) continue;

    const day = addDays(today, blueprint.dayOffset);
    const start = atHour(day, blueprint.hour, 0);
    const end = atHour(day, blueprint.hour + 2, 0);

    await prisma.slot.create({
      data: {
        questId: questRecord.id,
        startTime: start,
        endTime: end,
        price: quest.price,
        isBooked: false,
      },
    });
  }

  // Make sure actors exist for assignment dropdown/testing.
  await prisma.actor.deleteMany({ where: { name: { in: ["Игорь Блейк", "Мария Кросс", "Илья Стоун"] } } });
  await prisma.actor.createMany({
    data: [
      { name: "Игорь Блейк", hourlyRate: 35 },
      { name: "Мария Кросс", hourlyRate: 40 },
      { name: "Илья Стоун", hourlyRate: 32 },
    ],
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
