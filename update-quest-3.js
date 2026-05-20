require("dotenv/config");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("./src/generated/prisma");

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL missing");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

(async () => {
  const id = "cmpdemu6k0003tew7jhsku76g"; // было: Кибер-ограбление 2084

  const newTitle = "Не дыши";
  const newDescription = `Группе друзей с мелкокриминальными наклонностями дали задание забраться в старую мебельную фабрику. Владельцем ее был слепой старик Забраться им нужно с целью украсть немалую сумму денег, которая по слухам спрятана где-то внутри. Казалось бы, что может быть проще, чем вынести деньги беспомощного слепого инвалида, но грабители очень сильно ошибаются, и вот уже жертва становится преследователем`;

  await prisma.quest.update({
    where: { id },
    data: { title: newTitle, description: newDescription },
  });

  const q = await prisma.quest.findUnique({ where: { id }, select: { title: true } });
  console.log("OK. Updated quest:", id, "|", q?.title);

  await prisma.$disconnect();
})().catch(async (e) => {
  console.error("ERROR:", e);
  try { await prisma.$disconnect(); } catch {}
  process.exit(1);
});
