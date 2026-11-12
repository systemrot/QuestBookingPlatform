import Image from "next/image";
import type { ReactNode } from "react";

type HomeHeroProps = {
  children?: ReactNode;
};

export function HomeHero({ children }: HomeHeroProps) {
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden pb-0">
      {/* Shared cover stage: cabin + character scale like one object-fit:cover plate */}
      <div className="hero-cover-viewport absolute inset-0 -z-30">
        <div className="hero-cover-stage animate-hero-drift">
          <Image
            src="/brand/hero-cabin.jpg"
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover"
          />
          <div className="hero-character-slot animate-character-breathe" aria-hidden>
            <Image
              src="/brand/hero-character-hi.png"
              alt=""
              fill
              priority
              unoptimized
              sizes="50vw"
              className="object-contain object-bottom drop-shadow-[0_24px_48px_rgba(0,0,0,0.65)]"
            />
          </div>
        </div>
      </div>

      {/* Light veil only — keep plate sharp and colorful */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-[48%] bg-gradient-to-l from-black/36 via-black/10 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[42%] bg-gradient-to-t from-black via-black/55 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[28%] bg-[radial-gradient(ellipse_at_center,rgba(185,28,28,0.12),transparent_72%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 mix-blend-overlay opacity-[0.03] noise-overlay"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[74rem] flex-col justify-start gap-10 px-4 pb-6 pt-24 sm:gap-12 sm:px-6 sm:pb-8 lg:gap-14 lg:pt-28">
        {/* Title aligned with catalog cards */}
        <div className="text-left">
          <h1 className="hero-title space-y-1">
            <span className="hero-line hero-line--light hero-line--single">
              Яркие сценарии и живые эмоции
            </span>
            <span className="hero-line hero-line--blood">
              — в одном шаге от вас!
            </span>
          </h1>
        </div>

        {children ? (
          <div id="catalog" className="relative z-10 scroll-mt-24">
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}
