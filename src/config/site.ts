/**
 * Единая точка для бренда и внешних ссылок футера.
 * Замените URL на свои Telegram и VK.
 */
export const siteConfig = {
  brandName: "НеКвест",
  /** Канонический публичный URL (без trailing slash). */
  siteUrl: "https://nekvest.ru",
  /** Текст в футере (2–3 предложения) */
  footerAbout:
    "НеКвест помогает забронировать лучшие квесты в вашем городе: честные цены, удобные слоты и поддержка на каждом шаге.",
  /** Соцсети — подставьте свои каналы/группы */
  social: {
    telegram: "https://t.me/questbook",
    /** Группа НеКвест; услуги/описания: vk.ru/uslugi-226250343 */
    vk: "https://vk.com/nekvest",
  },
  /**
   * Контакты для NAP / schema. Пустые поля не публикуем в разметке —
   * лучше без адреса, чем чужой или выдуманный.
   * Заполните streetAddress/telephone, когда будут свои данные по площадкам.
   */
  contact: {
    /** E.164 или красивый вид для людей, напр. +7 (9XX) XXX-XX-XX */
    telephone: "" as string,
    email: "" as string,
  },
  /** Города присутствия (футер + Organization.areaServed). */
  citiesServed: [
    { slug: "oryol" as const, name: "Орёл" },
    { slug: "smolensk" as const, name: "Смоленск" },
  ],
  /**
   * Опциональный NAP по городу. Без streetAddress LocalBusiness не отдаём —
   * только Organization + areaServed.
   */
  locations: {
    oryol: {
      streetAddress: "" as string,
      postalCode: "" as string,
      addressCountry: "RU",
      /** WGS84, если известны координаты входа */
      geo: null as null | { lat: number; lng: number },
      openingHours: null as null | string[],
    },
    smolensk: {
      streetAddress: "" as string,
      postalCode: "" as string,
      addressCountry: "RU",
      geo: null as null | { lat: number; lng: number },
      openingHours: null as null | string[],
    },
  },
} as const;

/** Публичный URL для SEO / sitemap; env перекрывает дефолт бренда. */
export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    siteConfig.siteUrl
  );
}

export type SiteConfig = typeof siteConfig;
