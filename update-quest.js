require("dotenv/config");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("./src/generated/prisma");

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL missing");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

(async () => {
  const id = "cmpdemu6d0002tew7tsd7j9it"; // Поворот не туда

  const newTitle = "Поворот не туда"; // можно оставить как есть
  const newDescription = ` Приемная шерифа Джима Хокинса, говорите!
 Свяжите меня с шерифом, срочно!
 Мэм, представьтесь, пожалуйста!
 Тут повсюду кровь и ужасная вонь! О нет! Я... Я вижу людей... Мертвых людей!
 Расскажите, где вы находитесь?
 Я не знаю, где я, мне очень страшно! Он отрубил мне ноги, я не могу двигаться.
 Мэм, я вас не понимаю, кто он?
 Какой-то урод! Он взял мою ногу и начал ее есть! Он идет мне очень страшнопомогите Аааааааа
 Мэм, алло! Не вешайте трубку Алло`;

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
