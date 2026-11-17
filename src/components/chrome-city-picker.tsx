"use client";

import { usePathname } from "next/navigation";

import { CityPicker } from "@/components/city-picker";
import { isCitySlug } from "@/lib/city-slug";

type Props = {
  cities: { slug: string; name: string }[];
  currentSlug: string;
  className?: string;
};

/**
 * Header city picker for non-home pages only.
 * On /oryol|/smolensk the split hero already mounts its own picker — keeping
 * both alive caused a spurious Soft-nav flip between cities.
 */
export function ChromeCityPicker(props: Props) {
  const pathname = usePathname();
  const seg = pathname.replace(/^\//, "").split("/")[0] ?? "";
  if (pathname === "/" || isCitySlug(seg)) return null;
  return <CityPicker {...props} />;
}
