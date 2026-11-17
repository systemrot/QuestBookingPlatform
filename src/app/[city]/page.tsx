import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HomeCatalog } from "@/components/home-catalog";
import { getCitySeo } from "@/config/city-seo";
import { siteConfig } from "@/config/site";
import { isCitySlug, type CitySlug } from "@/lib/city";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type Props = {
  params: Promise<{ city: string }>;
};

export function generateStaticParams() {
  return [{ city: "oryol" }, { city: "smolensk" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: raw } = await params;
  if (!isCitySlug(raw)) return {};
  const seo = getCitySeo(raw);
  const title = `Квесты ${seo.inCity}`;
  const description = seo.blurb.slice(0, 160);

  return {
    title,
    description,
    alternates: { canonical: `/${raw}` },
    openGraph: {
      title: `${title} — ${siteConfig.brandName}`,
      description,
      url: `/${raw}`,
    },
  };
}

export default async function CityHomePage({ params }: Props) {
  const { city: raw } = await params;
  if (!isCitySlug(raw)) notFound();
  return <HomeCatalog citySlug={raw as CitySlug} />;
}
