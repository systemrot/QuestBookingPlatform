import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HomeCatalog } from "@/components/home-catalog";
import { siteConfig } from "@/config/site";
import {
  getCityBySlug,
  isCitySlug,
  type CitySlug,
} from "@/lib/city";

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
  const city = await getCityBySlug(raw);
  const name = city?.name ?? (raw === "oryol" ? "Орле" : "Смоленске");
  const inCity =
    raw === "oryol" ? "Орле" : raw === "smolensk" ? "Смоленске" : name;
  const title = `Квесты в ${inCity}`;
  const description = `Страшные квесты для детей и взрослых в ${inCity}. ${siteConfig.brandName} — онлайн-заявка, слоты и поддержка. Официальный партнёр «Мир квестов».`;

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
