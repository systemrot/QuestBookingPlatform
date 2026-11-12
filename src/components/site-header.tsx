import Link from "next/link";

import { auth } from "@/auth";
import { CityPicker } from "@/components/city-picker";
import { CitySuggestBanner } from "@/components/city-suggest-banner";
import { SiteNav } from "@/components/site-nav";
import { siteConfig } from "@/config/site";
import {
  getSelectedCitySlug,
  getSuggestedCitySlug,
  listCities,
} from "@/lib/city";

export async function SiteHeader() {
  const session = await auth();
  const [cities, currentSlug, suggestedSlug] = await Promise.all([
    listCities(),
    getSelectedCitySlug(),
    getSuggestedCitySlug(),
  ]);

  const suggested =
    suggestedSlug && suggestedSlug !== currentSlug
      ? cities.find((c) => c.slug === suggestedSlug)
      : null;

  return (
    <>
      {suggested ? (
        <CitySuggestBanner
          suggestedSlug={suggested.slug}
          suggestedName={suggested.name}
        />
      ) : null}
      <header className="sticky top-0 z-40 overflow-visible border-b border-blood/25 bg-black/45 backdrop-blur-md">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-1.5 overflow-visible px-2 py-2 sm:gap-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-1 sm:gap-3">
            <Link
              href="/"
              className="shrink-0 font-display text-[1.05rem] uppercase tracking-[0.04em] text-white [text-shadow:0_0_18px_rgba(220,38,38,0.35)] sm:text-xl"
            >
              {siteConfig.brandName}
            </Link>
            {cities.length > 0 ? (
              <CityPicker cities={cities} currentSlug={currentSlug} />
            ) : null}
          </div>
          <SiteNav session={session} />
        </div>
      </header>
    </>
  );
}
