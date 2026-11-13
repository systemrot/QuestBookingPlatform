import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.brandName} — бронирование квестов`,
    short_name: siteConfig.brandName,
    description:
      "Яркие сценарии и живые эмоции. Бронируйте квесты онлайн: удобные слоты и оплата за 20 минут.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0707",
    theme_color: "#0a0707",
    lang: "ru",
    icons: [
      {
        src: "/brand/nekvest-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
