/**
 * Local-only catalog padding for layout previews.
 * Never runs in production. Does not write to the database.
 *
 * Enable with DEMO_FAT_CATALOG=1 in .env.local
 * Optional: DEMO_FAT_CATALOG_ORYOL=7 DEMO_FAT_CATALOG_SMOLENSK=12
 */

const COVER_CYCLE = [
  "/brand/covers/dyshi-v5.jpg",
  "/brand/covers/kluch-v3.jpg",
  "/brand/covers/povorot-v4.jpg",
] as const;

const DEMO_TITLES = [
  "Чердак без выхода",
  "Тихий этаж",
  "Комната с зеркалами",
  "Последний звонок",
  "Слепая зона",
  "Дом на окраине",
  "Подвал №9",
  "Ночной рейс",
  "Запертая станция",
  "Красная лента",
  "Шёпот в шахте",
  "Лабиринт смотрителя",
  "Исчезнувший вагон",
  "Чёрный архив",
  "Этаж между этажами",
] as const;

type CatalogSeed = {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  imageAlt?: string | null;
  price: { toString(): string } | string | number;
};

function targetForSlug(slug: string): number | null {
  if (process.env.NODE_ENV === "production") return null;
  if (process.env.DEMO_FAT_CATALOG !== "1") return null;

  const raw =
    slug === "oryol"
      ? process.env.DEMO_FAT_CATALOG_ORYOL
      : slug === "smolensk"
        ? process.env.DEMO_FAT_CATALOG_SMOLENSK
        : undefined;
  const n = Number(raw ?? (slug === "oryol" ? 7 : slug === "smolensk" ? 12 : 0));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(Math.floor(n), 40);
}

/** Expand catalog to the demo target size for the selected city. */
export function padCatalogForLocalDemo<T extends CatalogSeed>(
  quests: T[],
  citySlug: string
): T[] {
  const target = targetForSlug(citySlug);
  if (target == null || quests.length >= target) return quests;

  const out = [...quests];
  let i = 0;
  while (out.length < target) {
    const base = quests[i % Math.max(quests.length, 1)];
    const idx = out.length;
    const title = DEMO_TITLES[idx % DEMO_TITLES.length] ?? `Демо квест ${idx + 1}`;
    const image =
      base?.image || COVER_CYCLE[idx % COVER_CYCLE.length] || COVER_CYCLE[0];
    const price = base?.price ?? 4990;
    const description =
      base?.description ??
      "Демо-карточка для проверки сетки каталога. В базу не сохраняется.";

    out.push({
      ...(base as T),
      id: `demo-${citySlug}-${idx + 1}`,
      title: `${title} · демо`,
      description,
      image,
      price,
    } as T);
    i += 1;
  }
  return out;
}
