import type { ReactNode } from "react";

import { auth } from "@/auth";
import { CityHomeLink } from "@/components/city-home-link";
import { CityPicker } from "@/components/city-picker";
import { Footer } from "@/components/Footer";
import { HeroSceneMedia } from "@/components/hero-scene-media";
import { MarkHomeSplit } from "@/components/mark-home-split";
import { SiteNav } from "@/components/site-nav";
import { siteConfig } from "@/config/site";
import {
  getCityBySlug,
  getSelectedCity,
  getSelectedCitySlug,
  isCitySlug,
  listCities,
  type CitySlug,
} from "@/lib/city";

type HomeHeroProps = {
  children?: ReactNode;
  /** Full-bleed under catalog (outside the right column — soft scrim can reach the character). */
  seo?: ReactNode;
  catalogCount?: number;
  /** URL city wins over cookie so /smolensk label matches catalog. */
  citySlug?: CitySlug;
  /** H2 above the grid. */
  catalogLabel?: string;
};

export async function HomeHero({
  children,
  seo,
  catalogCount = 0,
  citySlug,
  catalogLabel = "Каталог квестов",
}: HomeHeroProps) {
  const cookieSlug = await getSelectedCitySlug();
  const currentSlug =
    citySlug && isCitySlug(citySlug) ? citySlug : cookieSlug;

  const [session, cities, city] = await Promise.all([
    auth(),
    listCities(),
    getCityBySlug(currentSlug).then(
      (row) => row ?? getSelectedCity().catch(() => null)
    ),
  ]);

  const cityLabel = city?.name ?? "ваш город";

  return (
    <div className="home-split" data-home-split-root>
      <MarkHomeSplit />

      <div className="home-split-hero">
        <div className="home-split-scene" aria-hidden>
          <div className="home-split-plate">
            <HeroSceneMedia />
          </div>
          <div className="home-split-veil home-split-veil--glow" />
          <div className="home-split-veil home-split-veil--x" />
          <div className="home-split-veil home-split-veil--y" />
        </div>

        <header className="home-split-top">
          <div className="home-split-brand">
            <CityHomeLink
              fallbackSlug={currentSlug}
              className="shrink-0 font-display text-[1.35rem] uppercase tracking-[0.04em] text-white [text-shadow:0_0_18px_rgba(220,38,38,0.35)] sm:text-[1.55rem]"
            >
              {siteConfig.brandName}
            </CityHomeLink>
            {cities.length > 0 ? (
              <CityPicker cities={cities} currentSlug={currentSlug} />
            ) : null}
          </div>
          <div className="home-split-nav">
            <SiteNav session={session} />
          </div>
        </header>

        <aside className="home-split-stage" aria-hidden />

        <div className="home-split-main">
          <div className="home-split-copy">
            <p className="home-split-eyebrow">
              <span className="home-split-eyebrow-accent">Бронирование</span>{" "}
              <span className="home-split-eyebrow-rest">
                квестов ·{" "}
                <span className="home-split-eyebrow-city">{cityLabel}</span>
              </span>
            </p>
            <h1 className="hero-title home-split-hero-title">
              <span className="hero-line hero-line--light hero-line--single">
                Яркие сценарии и живые эмоции —
              </span>
              <span className="hero-line hero-line--blood">
                в одном шаге от вас!
              </span>
            </h1>
          </div>

          {children ? (
            <div id="catalog" className="home-split-catalog scroll-mt-24">
              {catalogCount > 0 ? (
                <div className="home-split-catalog-bar">
                  <h2 className="home-split-catalog-label">{catalogLabel}</h2>
                </div>
              ) : null}
              {children}
            </div>
          ) : null}
        </div>

        {seo ? <div className="home-split-seo">{seo}</div> : null}
      </div>

      <div className="home-split-footer">
        <Footer embedded />
      </div>
    </div>
  );
}
