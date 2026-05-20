require("dotenv/config");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("./src/generated/prisma");

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL missing");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

(async () => {
  const id = "cmpdemu6v0004tew75bwi9g90"; // было: Пиратская бухта

  const newTitle = "Ключ от всех дверей";
  const newDescription = `Вы работники социальной службы. Вас отправили к пожилому инвалиду Бэну Дэвиро - владельцу огромного особняка, неподалеку от Луизианы
Однажды, вы обнаруживаете на чердаке секретную комнату с массой мистических предметов. Хозяин утверждает, что вещи принадлежат бывшим владельцам, которые занимались магией. 
Вскоре вы становитесь свидетелями довольно странных и необъяснимых событий и перед вами запираются все двери`;

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
