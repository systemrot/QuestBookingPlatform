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
};

export async function HomeHero({ children }: HomeHeroProps) {
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

      {/* Left stage: cabin + character (knife may overlap footer) */}
      <aside className="home-split-stage" aria-hidden>
        <div className="home-split-stage-frame">
          <div className="home-split-cabin">
            <Image
              src="/brand/hero-cabin.jpg"
              alt=""
              fill
              priority
              unoptimized
              sizes="42vw"
              className="object-cover object-[28%_42%]"
            />
          </div>
          <div className="home-split-character animate-character-breathe">
            <Image
              src="/brand/hero-character-hi.png"
              alt=""
              fill
              priority
              unoptimized
              sizes="42vw"
              className="object-contain object-bottom drop-shadow-[0_24px_48px_rgba(0,0,0,0.65)]"
            />
          </div>
          <div className="home-split-stage-veil" />
        </div>
      </aside>

      {/* Top bar: logo+city over left, nav over right */}
      <header className="home-split-top">
        <div className="home-split-brand">
          <Link
            href="/"
            className="shrink-0 font-display text-[1.15rem] uppercase tracking-[0.04em] text-white [text-shadow:0_0_18px_rgba(220,38,38,0.35)] sm:text-xl"
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

      {/* Right content column */}
      <div className="home-split-main">
        <div className="home-split-copy">
          <p className="home-split-eyebrow">
            Бронирование квестов · {cityLabel}
          </p>
          <h1 className="hero-title space-y-1">
            <span className="hero-line hero-line--light hero-line--single">
              Яркие сценарии и живые эмоции
            </span>
            <span className="hero-line hero-line--blood">
              — в одном шаге от вас!
            </span>
          </h1>
          <p className="home-split-lede">
            Выберите сценарий, день и время — слот держится 20 минут на оплату.
          </p>
        </div>

        {children ? (
          <div id="catalog" className="relative z-10 scroll-mt-24">
            {children}
          </div>
        ) : null}
      </div>

      <div className="home-split-footer">
        <Footer embedded />
      </div>
    </div>
  );
}
