"use server";

import { revalidatePath } from "next/cache";

import { isCitySlug, setCityCookie, type CitySlug } from "@/lib/city";

export async function selectCity(slug: string) {
  if (!isCitySlug(slug)) {
    return { error: "Неизвестный город." as const };
  }
  await setCityCookie(slug as CitySlug);
  revalidatePath("/", "layout");
  return { success: true as const, slug: slug as CitySlug };
}
