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
  const questId = "cmpdytav00000mmw7sot6z8yi";
  const price = 5490;
  const durationHours = 1;

  const now = new Date();
  const fromDay = startOfDay(now);

  // конец мая текущего года, 23:59:59
  const endMay = new Date(now.getFullYear(), 4, 31, 23, 59, 59, 999); // month=4 => May

  const startHour = 10;
  const endHour = 22; // последний слот стартует в 21:00 и заканчивается в 22:00

  // 1) удалить существующие слоты в диапазоне (чтобы не было дублей)
  const existingSlots = await prisma.slot.findMany({
    where: {
      questId,
      startTime: { gte: fromDay, lte: endMay },
    },
    select: { id: true },
  });

  if (existingSlots.length) {
    const ids = existingSlots.map(s => s.id);
    await prisma.assignment.deleteMany({ where: { slotId: { in: ids } } });
    await prisma.booking.deleteMany({ where: { slotId: { in: ids } } });
    await prisma.slot.deleteMany({ where: { id: { in: ids } } });
    console.log("Deleted existing slots:", ids.length);
  }

  // 2) создать новые слоты
  let created = 0;
  for (let d = new Date(fromDay); d <= endMay; d.setDate(d.getDate() + 1)) {
    for (let h = startHour; h < endHour; h++) {
      const start = atHour(d, h);
      const end = atHour(d, h + durationHours);

      await prisma.slot.create({
        data: {
          questId,
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
