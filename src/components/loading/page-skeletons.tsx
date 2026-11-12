import Image from "next/image";
import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/config/site";

export function BookingsPageSkeleton() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Skeleton className="h-7 w-28" />
      </div>
      <ul className="flex flex-col gap-4">
        {[0, 1].map((i) => (
          <li key={i} className="rounded-xl border border-border/80 bg-card/50 p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-7 w-24" />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

export function ProfilePageSkeleton() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="rounded-xl border border-border/80 bg-card/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="mb-6 h-4 w-40" />
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between gap-4 border-b border-border/60 py-2 last:border-0">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-4 h-8 w-full" />
        </div>
        <div className="rounded-xl border border-border/80 bg-card/50 p-6">
          <Skeleton className="mb-2 h-7 w-44" />
          <Skeleton className="mb-6 h-4 w-64" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </main>
  );
}

/** Matches the split horror homepage — scene stays, catalog pulses. */
export function CatalogPageSkeleton() {
  return (
    <main className="flex w-full flex-1 flex-col" aria-busy="true" aria-label="Загрузка">
      <div className="home-split" data-home-split-root>
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
              <div className="home-split-content-veil">
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
              <Skeleton className="h-8 w-[5.5rem] rounded-full bg-white/10" />
            </div>
            <div className="home-split-nav flex items-center">
              <Skeleton className="size-10 rounded-md bg-white/10" />
            </div>
          </header>

          <aside className="home-split-stage" aria-hidden />

          <div className="home-split-main">
            <div className="home-split-copy">
              <p className="home-split-eyebrow">
                <span className="home-split-eyebrow-accent">Бронирование</span>{" "}
                <span className="home-split-eyebrow-rest">квестов</span>
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

            <div className="home-split-catalog">
              <div className="home-split-catalog-bar">
                <Skeleton className="h-7 w-[8.5rem] rounded-[10px] bg-white/10" />
              </div>
              <ul className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="min-w-0 h-full">
                    <div className="relative flex h-full flex-col overflow-visible rounded-xl border border-white/10 bg-black/40">
                      <Skeleton className="aspect-[16/10] w-full rounded-t-xl rounded-b-none bg-white/10" />
                      <div className="flex flex-1 flex-col gap-2 p-3.5">
                        <Skeleton className="h-5 w-3/4 bg-white/15" />
                        <Skeleton className="h-3.5 w-full bg-white/10" />
                        <Skeleton className="mt-auto h-9 w-full rounded-md bg-white/10" />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export function SimplePageSkeleton({
  titleWidth = "w-48",
  lines = 3,
}: {
  titleWidth?: string;
  lines?: number;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
      <Skeleton className={`h-9 ${titleWidth}`} />
      <Skeleton className="mt-2 h-4 w-32" />
      <div className="mt-8 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </main>
  );
}

export function AuthPageSkeleton() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <div className="mb-8 space-y-2 text-center">
        <Skeleton className="mx-auto h-8 w-24" />
        <Skeleton className="mx-auto h-4 w-full max-w-xs" />
      </div>
      <div className="space-y-3 rounded-xl border border-border/80 bg-card/50 p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </main>
  );
}
