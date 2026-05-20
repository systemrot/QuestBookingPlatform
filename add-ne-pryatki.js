require("dotenv/config");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("./src/generated/prisma");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function atHour(base, hour) {
  const x = new Date(base);
  x.setHours(hour, 0, 0, 0);
  return x;
}

(async () => {
  const title = "НЕ ПРЯТКИ";
  const description = `Много лет назад на месте нынешнего заброшенного склада располагался секретный бункер. В нём проводились бесчеловечные эксперименты над людьми  учёные пытались создать идеального исполнителя, способного манипулировать страхом. В результате одного из опытов на свет появился клоун Пенивайз  существо, питающееся ужасом своих жертв.

Бункер был спешно закрыт, а все записи засекречены. Со временем над ним построили склад, но мистическая энергия места просочилась наружу: сотрудники начали исчезать, а сам магазин закрылся при загадочных обстоятельствах.

Теперь вы  группа исследователей, спустившихся в подземелье, чтобы раскрыть тайну Пенивайза. Но вы не учли одного: он давно ждёт новых игрушек`;

  const price = 6990;
  const image = "/ne-pryatki.jpg"; // если нет картинки  можно оставить так

  // 1) создать квест (если уже есть  обновить)
  const existing = await prisma.quest.findFirst({ where: { title } });
  const quest = existing
    ? await prisma.quest.update({
        where: { id: existing.id },
        data: { description, price, image },
      })
    : await prisma.quest.create({
        data: { title, description, price, image },
      });

  console.log("Quest:", quest.id, quest.title);

  // 2) слоты до конца мая
  const now = new Date();
  const fromDay = startOfDay(now);
  const endMay = new Date(now.getFullYear(), 4, 31, 23, 59, 59, 999); // May

  const startHour = 10;
  const endHour = 22; // создаём старты 10..21
  const durationHours = 1;

  // удалим существующие слоты этого квеста в диапазоне, чтобы не плодить дубли
  const existingSlots = await prisma.slot.findMany({
    where: { questId: quest.id, startTime: { gte: fromDay, lte: endMay } },
    select: { id: true },
  });
  if (existingSlots.length) {
    const ids = existingSlots.map(s => s.id);
    await prisma.assignment.deleteMany({ where: { slotId: { in: ids } } });
    await prisma.booking.deleteMany({ where: { slotId: { in: ids } } });
    await prisma.slot.deleteMany({ where: { id: { in: ids } } });
    console.log("Deleted existing slots:", ids.length);
  }

  let created = 0;
  for (let d = new Date(fromDay); d <= endMay; d.setDate(d.getDate() + 1)) {
    for (let h = startHour; h < endHour; h++) {
      const start = atHour(d, h);
      const end = atHour(d, h + durationHours);
      await prisma.slot.create({
        data: {
          questId: quest.id,
          startTime: start,
          endTime: end,
          price,
          isBooked: false,
        },
      });
      created++;
    }
  }

  console.log("Created slots:", created);
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error("ERROR:", e);
  try { await prisma.$disconnect(); } catch {}
  process.exit(1);
});
