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
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="min-w-0 shrink font-heading text-sm font-semibold tracking-tight text-foreground"
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
