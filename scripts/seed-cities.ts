/**
 * Seed Орёл + Смоленск (те же квесты, разные актёры) с ретраями через pg.
 * Run: npx tsx scripts/seed-cities.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";

const url = process.env.DATABASE_URL_TX || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL required");

const QUEST_DEFS = [
  {
    titles: ["Потерянная крипта", "Не дыши", "The Lost Crypt"],
    title: "Не дыши",
    description:
      "Группе друзей с мелкокриминальными наклонностями дали задание забраться в старую мебельную фабрику. Владельцем ее был слепой старик… Забраться им нужно с целью украсть немалую сумму денег, которая по слухам спрятана где-то внутри. Казалось бы, что может быть проще, чем вынести деньги беспомощного слепого инвалида, но грабители очень сильно ошибаются, и вот уже жертва становится преследователем…",
    image: "/Dyshi.jpg",
    price: 6489.99,
  },
  {
    titles: [
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
    titles: [
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

const ACTORS: Record<string, { name: string; rate: number }[]> = {
  oryol: [
    { name: "Игорь Блейк", rate: 35 },
    { name: "Мария Кросс", rate: 40 },
    { name: "Илья Стоун", rate: 32 },
  ],
  smolensk: [
    { name: "Артём Волков", rate: 35 },
    { name: "Елена Норова", rate: 40 },
    { name: "Дмитрий Серов", rate: 33 },
  ],
};

function cuidLike() {
  return (
    "c" +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10)
  );
}

async function withClient<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  let last: unknown;
  for (let i = 1; i <= 5; i++) {
    const client = new pg.Client({
      connectionString: url,
      connectionTimeoutMillis: 20_000,
      statement_timeout: 120_000,
    });
    client.on("error", () => {
      /* swallow late disconnects after end */
    });
    try {
      await client.connect();
      return await fn(client);
    } catch (e) {
      last = e;
      console.warn(`  retry ${i}:`, e instanceof Error ? e.message : e);
      await new Promise((r) => setTimeout(r, 1200 * i));
    } finally {
      await client.end().catch(() => undefined);
    }
  }
  throw last;
}

async function main() {
  const passwordHash = bcrypt.hashSync("password", 10);

  console.log("users…");
  await withClient(async (c) => {
    await c.query(
      `INSERT INTO "User" (id, name, email, password, role, age, "createdAt", "updatedAt")
       VALUES ($1,'Алексей Игрок','user@example.com',$2,'USER',28,NOW(),NOW())
       ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, "updatedAt" = NOW()`,
      [cuidLike(), passwordHash]
    );
    await c.query(
      `INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt")
       VALUES ($1,'Админ Квестов','admin@example.com',$2,'ADMIN',NOW(),NOW())
       ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, "updatedAt" = NOW()`,
      [cuidLike(), passwordHash]
    );
  });

  console.log("cities…");
  await withClient(async (c) => {
    await c.query(
      `INSERT INTO "City" (id, slug, name, "createdAt", "updatedAt") VALUES
        ('c_oryol','oryol','Орёл',NOW(),NOW()),
        ('c_smolensk','smolensk','Смоленск',NOW(),NOW())
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW()`
    );
  });

  const { listScheduleStarts, slotEndTime } = await import(
    "../src/lib/booking-policy"
  );
  const starts = listScheduleStarts(new Date());

  for (const city of [
    { id: "c_oryol", slug: "oryol" },
    { id: "c_smolensk", slug: "smolensk" },
  ]) {
    console.log(`quests ${city.slug}…`);
    const questIds: string[] = [];

    for (const q of QUEST_DEFS) {
      const id = await withClient(async (c) => {
        const found = await c.query<{ id: string }>(
          `SELECT id FROM "Quest"
           WHERE "cityId" = $1 AND title = ANY($2::text[])
           ORDER BY "updatedAt" DESC LIMIT 1`,
          [city.id, [...q.titles]]
        );
        if (found.rows[0]) {
          await c.query(
            `UPDATE "Quest" SET title=$2, description=$3, image=$4, price=$5, "updatedAt"=NOW()
             WHERE id=$1`,
            [found.rows[0].id, q.title, q.description, q.image, q.price]
          );
          return found.rows[0].id;
        }
        const newId = cuidLike();
        await c.query(
          `INSERT INTO "Quest" (id, title, description, image, price, "cityId", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())`,
          [newId, q.title, q.description, q.image, q.price, city.id]
        );
        return newId;
      });
      questIds.push(id);
    }

    console.log(`slots ${city.slug}…`);
    for (const questId of questIds) {
      const existing = await withClient(async (c) => {
        const r = await c.query<{ n: string }>(
          `SELECT COUNT(*)::text AS n FROM "Slot" WHERE "questId"=$1`,
          [questId]
        );
        return Number(r.rows[0]?.n ?? 0);
      });
      if (existing > 0) {
        console.log(`  quest ${questId}: already ${existing} slots — skip`);
        continue;
      }
      const price = await withClient(async (c) => {
        const priceRes = await c.query<{ price: string }>(
          `SELECT price::text AS price FROM "Quest" WHERE id=$1`,
          [questId]
        );
        return priceRes.rows[0]?.price ?? "0";
      });
      for (let i = 0; i < starts.length; i += 10) {
        const chunk = starts.slice(i, i + 10);
        await withClient(async (c) => {
          const values: unknown[] = [];
          const placeholders: string[] = [];
          let p = 1;
          for (const start of chunk) {
            const end = slotEndTime(start);
            placeholders.push(
              `($${p++},$${p++},$${p++},false,$${p++},$${p++},NOW(),NOW())`
            );
            values.push(
              cuidLike(),
              start.toISOString(),
              end.toISOString(),
              questId,
              price
            );
          }
          await c.query(
            `INSERT INTO "Slot" (id, "startTime", "endTime", "isBooked", "questId", price, "createdAt", "updatedAt")
             VALUES ${placeholders.join(",")}
             ON CONFLICT ("questId", "startTime") DO NOTHING`,
            values
          );
        });
        console.log(`  quest ${questId}: chunk ${i / 10 + 1}`);
      }
    }

    console.log(`actors ${city.slug}…`);
    const defs = ACTORS[city.slug] ?? [];
    await withClient(async (c) => {
      for (const a of defs) {
        const exists = await c.query(
          `SELECT 1 FROM "Actor" WHERE "cityId"=$1 AND name=$2 LIMIT 1`,
          [city.id, a.name]
        );
        if (exists.rowCount === 0) {
          await c.query(
            `INSERT INTO "Actor" (id, name, "hourlyRate", "cityId", "createdAt", "updatedAt")
             VALUES ($1,$2,$3,$4,NOW(),NOW())`,
            [cuidLike(), a.name, a.rate, city.id]
          );
        }
      }
    });
  }

  await withClient(async (c) => {
    const cities = await c.query(`SELECT slug, name FROM "City" ORDER BY name`);
    const quests = await c.query(
      `SELECT c.name AS city, COUNT(*)::int AS n
       FROM "Quest" q JOIN "City" c ON c.id=q."cityId"
       GROUP BY c.name ORDER BY c.name`
    );
    const actors = await c.query(
      `SELECT c.name AS city, a.name
       FROM "Actor" a JOIN "City" c ON c.id=a."cityId"
       ORDER BY c.name, a.name`
    );
    console.log("cities:", cities.rows);
    console.log("quests:", quests.rows);
    console.log(
      "actors:",
      actors.rows.map((r) => `${r.city}: ${r.name}`).join(" | ")
    );
  });

  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
