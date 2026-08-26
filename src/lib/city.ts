import { cookies, headers } from "next/headers";

import { dbUrgent } from "@/lib/prisma";

export const CITY_COOKIE = "qb_city";
export const DEFAULT_CITY_SLUG = "oryol";

export type CitySlug = "oryol" | "smolensk";

export type CityRow = {
  id: string;
  slug: string;
  name: string;
};

const CITY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const cookieBase = {
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

export function isCitySlug(value: string): value is CitySlug {
  return value === "oryol" || value === "smolensk";
}

/** Vercel / CDN soft hint → наш slug (или null). */
export function mapGeoCityToSlug(raw: string | null | undefined): CitySlug | null {
  if (!raw) return null;
  const n = raw.trim().toLowerCase();
  if (
    n.includes("orel") ||
    n.includes("oryol") ||
    n.includes("орёл") ||
    n.includes("орел")
  ) {
    return "oryol";
  }
  if (n.includes("smolensk") || n.includes("смоленск")) {
    return "smolensk";
  }
  return null;
}

export async function listCities(): Promise<CityRow[]> {
  return dbUrgent((prisma) =>
    prisma.city.findMany({
      orderBy: { name: "asc" },
      select: { id: true, slug: true, name: true },
    })
  );
}

export async function getCityBySlug(slug: string): Promise<CityRow | null> {
  if (!isCitySlug(slug)) return null;
  return dbUrgent((prisma) =>
    prisma.city.findUnique({
      where: { slug },
      select: { id: true, slug: true, name: true },
    })
  );
}

/** Город из cookie; если нет — default Орёл. Не ставит cookie сама. */
export async function getSelectedCitySlug(): Promise<CitySlug> {
  const store = await cookies();
  const raw = store.get(CITY_COOKIE)?.value;
  if (raw && isCitySlug(raw)) return raw;
  return DEFAULT_CITY_SLUG;
}

export async function getSelectedCity(): Promise<CityRow> {
  const slug = await getSelectedCitySlug();
  const city = await getCityBySlug(slug);
  if (city) return city;
  const fallback = await getCityBySlug(DEFAULT_CITY_SLUG);
  if (!fallback) {
    throw new Error("Cities are not seeded (need oryol)");
  }
  return fallback;
}

/** Подсказка по IP только если cookie ещё не выбрана. */
export async function getSuggestedCitySlug(): Promise<CitySlug | null> {
  const store = await cookies();
  if (store.get(CITY_COOKIE)?.value) return null;

  const h = await headers();
  const geo =
    h.get("x-vercel-ip-city") ??
    h.get("cf-ipcity") ??
    h.get("x-geo-city");
  return mapGeoCityToSlug(geo);
}

export async function setCityCookie(slug: CitySlug) {
  const store = await cookies();
  store.set(CITY_COOKIE, slug, {
    ...cookieBase,
    httpOnly: false,
    maxAge: CITY_COOKIE_MAX_AGE,
  });
}
