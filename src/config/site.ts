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
    vk: "https://vk.com/nekvest",
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
