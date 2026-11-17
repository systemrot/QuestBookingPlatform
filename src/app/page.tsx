import type { Metadata } from "next";

import { HomeCatalog } from "@/components/home-catalog";
import { siteConfig } from "@/config/site";
import { getSelectedCitySlug } from "@/lib/city";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function generateMetadata(): Promise<Metadata> {
  const slug = await getSelectedCitySlug();
  return {
    alternates: { canonical: `/${slug}` },
    openGraph: {
      url: `/${slug}`,
      title: `${siteConfig.brandName} — бронирование квестов`,
    },
  };
}

/**
 * Fallback catalog if proxy redirect is bypassed.
 * Normal browser hits to `/` get HTTP 307 → /oryol|/smolensk in src/proxy.ts.
 */
export default async function HomePage() {
  const slug = await getSelectedCitySlug();
  return <HomeCatalog citySlug={slug} />;
}
