/** Edge/client-safe city slug helpers — no DB / cookies() imports. */

export const CITY_COOKIE = "qb_city";
export const DEFAULT_CITY_SLUG = "oryol";

export type CitySlug = "oryol" | "smolensk";

export function isCitySlug(value: string): value is CitySlug {
  return value === "oryol" || value === "smolensk";
}
