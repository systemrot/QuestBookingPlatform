require("dotenv/config");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("./src/generated/prisma");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

(async () => {
  const title = "Сталкер";
  const description = `Путники случайным образом попали в аномалию, которая перенесла их во вселенную Сталкер. Они оказываются на базе затонувших кораблей под названием Султанка. На верхних этажах корабля они находят торговца Сову, у которого для них есть работёнка(задание)`;

  const quest = await prisma.quest.create({
    data: {
      title,
      description,
      image: "/stalker.jpg", // если нет картинки  можно временно оставить так
      price: 0,              // поставь нужную цену
    },
  });

  console.log("Created quest:", quest.id, quest.title);
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error("ERROR:", e);
  try { await prisma.$disconnect(); } catch {}
  process.exit(1);
});
