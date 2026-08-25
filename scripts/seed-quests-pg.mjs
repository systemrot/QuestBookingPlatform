import "dotenv/config";
import pg from "pg";
import { randomUUID } from "node:crypto";

import { listScheduleStarts, slotEndTime } from "../src/lib/booking-policy.ts";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  ssl: { rejectUnauthorized: false },
});

const quests = [
  {
    title: "Не дыши",
    description:
      "Группе друзей с мелкокриминальными наклонностями дали задание забраться в старую мебельную фабрику…",
    image: "/Dyshi.jpg",
    price: 6489.99,
  },
  {
    title: "Ключ от всех дверей",
    description: "Вы работники социальной службы. Вас отправили к пожилому инвалиду Бэну Дэвиро…",
    image: "/Kluch.jpg",
    price: 5489.99,
  },
  {
    title: "Поворот не туда",
    description: "– Приемная шерифа Джима Хокинса, говорите! – Свяжите меня с шерифом, срочно!…",
    image: "/Povorot.jpg",
    price: 6489.99,
  },
];

async function main() {
  const existing = await pool.query('SELECT COUNT(*)::int AS n FROM "Quest"');
  if (existing.rows[0].n > 0) {
    console.log(`OK: ${existing.rows[0].n} quests already in DB`);
    await pool.end();
    return;
  }

  const questIds = [];
  for (const q of quests) {
    const id = randomUUID();
    await pool.query(
      `INSERT INTO "Quest" (id, title, description, image, price, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [id, q.title, q.description, q.image, q.price]
    );
    questIds.push({ id, price: q.price });
    console.log("quest:", q.title);
  }

  const starts = listScheduleStarts(new Date());
  for (const quest of questIds) {
    for (const start of starts) {
      const end = slotEndTime(start);
      await pool.query(
        `INSERT INTO "Slot" (id, "startTime", "endTime", "isBooked", "questId", price, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, false, $4, $5, NOW(), NOW())
         ON CONFLICT ("questId", "startTime") DO NOTHING`,
        [randomUUID(), start, end, quest.id, quest.price]
      );
    }
  }

  console.log(`OK: seeded ${questIds.length} quests with ${starts.length} slots each`);
  await pool.end();
}

main().catch(async (error) => {
  console.error("FAILED:", error);
  await pool.end();
  process.exit(1);
});
