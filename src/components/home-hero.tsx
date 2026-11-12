import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { auth } from "@/auth";
import { CityPicker } from "@/components/city-picker";
import { Footer } from "@/components/Footer";
import { MarkHomeSplit } from "@/components/mark-home-split";
import { SiteNav } from "@/components/site-nav";
import { siteConfig } from "@/config/site";
import {
  getSelectedCity,
  getSelectedCitySlug,
  listCities,
} from "@/lib/city";

type HomeHeroProps = {
  children?: ReactNode;
  catalogCount?: number;
};

export async function HomeHero({ children, catalogCount = 0 }: HomeHeroProps) {
  const [session, cities, currentSlug, city] = await Promise.all([
    auth(),
    listCities(),
    getSelectedCitySlug(),
    getSelectedCity().catch(() => null),
  ]);

  const cityLabel = city?.name ?? "ваш город";

  return (
    <div className="home-split" data-home-split-root>
      <MarkHomeSplit />

      <div className="home-split-hero">
        <div className="home-split-scene" aria-hidden>
          <div className="home-split-plate">
            <div className="home-split-cabin">
              <Image
                src="/brand/hero-cabin.jpg"
                alt=""
                fill
                priority
                unoptimized
                sizes="100vw"
                className="home-split-cabin-img object-cover"
              />
            </div>
            <div className="home-split-content-veil" aria-hidden>
              <Image
                src="/brand/ui/veil-content-tr.png"
                alt=""
                fill
                priority
                unoptimized
                sizes="70vw"
                className="object-fill object-right-top"
              />
            </div>
            <div className="home-split-character">
              <Image
                src="/brand/hero-character-hi.png"
                alt=""
                fill
                priority
                unoptimized
                sizes="42vw"
                className="object-contain object-left-bottom"
              />
            </div>
          </div>
          <div className="home-split-veil home-split-veil--glow" />
          <div className="home-split-veil home-split-veil--x" />
          <div className="home-split-veil home-split-veil--y" />
        </div>

        <header className="home-split-top">
          <div className="home-split-brand">
            <Link
              href="/"
              className="shrink-0 font-display text-[1.2rem] uppercase tracking-[0.04em] text-white [text-shadow:0_0_18px_rgba(220,38,38,0.35)] sm:text-xl"
            >
              {siteConfig.brandName}
            </Link>
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
                квестов · {cityLabel}
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
                  <span className="home-split-catalog-label">
                    Каталог квестов
                  </span>
                </div>
              ) : null}
              {children}
            </div>
          ) : null}
        </div>
      </div>

      <div className="home-split-footer">
        <Footer embedded />
      </div>
    </div>
  );
}
