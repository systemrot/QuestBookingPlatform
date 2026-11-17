import Link from "next/link";

import { HeroSceneMedia } from "@/components/hero-scene-media";
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
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
      <div className="grid gap-6 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)]">
        <div className="rounded-xl border border-border/80 bg-card/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="mb-6 h-4 w-40" />
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex justify-between gap-4 border-b border-border/60 py-2 last:border-0"
              >
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-4 h-8 w-full" />
        </div>
        <div className="min-w-0 rounded-xl border border-border/80 bg-card/50 p-6">
          <Skeleton className="mb-2 h-7 w-44" />
          <Skeleton className="mb-6 h-4 w-full max-w-md" />
          <div className="mb-4 flex flex-wrap gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-border/60 bg-background/30 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3.5 w-56" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function CatalogCardSkeleton() {
  return (
    <li className="min-w-0 h-full">
      <div className="group/quest relative flex h-full flex-col pb-6 sm:pb-7">
        <div className="flex h-full flex-col overflow-visible bg-transparent">
          <Skeleton className="aspect-[16/12] w-full rounded-none bg-white/10" />
          <div className="relative z-[1] -mt-10 flex flex-1 flex-col gap-2.5 bg-[oklch(0.1_0.012_25)] px-4 pb-1.5 pt-2 sm:-mt-12">
            <Skeleton className="h-6 w-3/4 bg-white/15" />
            <Skeleton className="h-3.5 w-full bg-white/10" />
            <Skeleton className="h-3.5 w-5/6 bg-white/10" />
          </div>
          <div className="mt-auto flex items-center bg-[oklch(0.1_0.012_25)] px-4 pb-6 pt-2 pr-16 sm:pb-7 sm:pr-20">
            <Skeleton className="h-11 w-[10.75rem] rounded-md bg-white/12" />
          </div>
        </div>
        <Skeleton className="absolute -bottom-3 -right-3 z-20 size-[6.75rem] rotate-[8deg] rounded-md bg-white/10 sm:-bottom-2 sm:-right-4 sm:size-[8rem] sm:rotate-[10deg]" />
      </div>
    </li>
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
              <HeroSceneMedia />
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
              <Skeleton className="h-8 w-[9.75rem] rounded-lg bg-white/10" />
            </div>
            <div className="home-split-nav flex items-center">
              <Skeleton className="size-10 rounded-md bg-white/10 sm:size-14" />
            </div>
          </header>

          <aside className="home-split-stage" aria-hidden />

          <div className="home-split-main">
            <div className="home-split-copy">
              <p className="home-split-eyebrow">
                <span className="home-split-eyebrow-accent">Бронирование</span>{" "}
                <span className="home-split-eyebrow-rest">
                  квестов ·{" "}
                  <span className="home-split-eyebrow-city" aria-hidden>
                    <span className="inline-block h-[0.85em] w-[4.75em] animate-pulse rounded-sm bg-white/15 align-middle" />
                  </span>
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

            <div className="home-split-catalog">
              <div className="home-split-catalog-bar">
                <Skeleton className="h-7 w-[10rem] rounded-[10px] bg-white/10" />
              </div>
              <ul className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">
                {[0, 1, 2].map((i) => (
                  <CatalogCardSkeleton key={i} />
                ))}
              </ul>
            </div>
          </div>

          <div className="home-split-seo">
            <section className="home-split-city-seo" aria-hidden>
              <Skeleton className="h-6 w-48 bg-white/15 sm:h-7 sm:w-56" />
              <Skeleton className="mt-3 h-4 w-full max-w-3xl bg-white/10" />
              <Skeleton className="mt-2 h-4 w-full max-w-2xl bg-white/10" />
              <Skeleton className="mt-3 h-4 w-full max-w-3xl bg-white/10" />
              <div className="mt-8 space-y-4">
                <Skeleton className="h-3 w-40 bg-white/10" />
                {[0, 1].map((i) => (
                  <div key={i} className="max-w-3xl space-y-1.5">
                    <Skeleton className="h-4 w-64 bg-white/15" />
                    <Skeleton className="h-3.5 w-full bg-white/10" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="home-split-footer" aria-hidden>
          <div className="home-split-footer-panel border-t border-blood/55">
            <div className="home-split-footer-inner w-full max-w-none px-4 sm:px-6">
              <div className="home-split-footer-about py-8">
                <Skeleton className="h-7 w-36 bg-white/15" />
                <Skeleton className="mt-3 h-3.5 w-full max-w-md bg-white/10" />
                <Skeleton className="mt-2 h-3.5 w-full max-w-sm bg-white/10" />
              </div>
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
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="flex items-center gap-3 py-1">
          <Skeleton className="h-px flex-1" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-px flex-1" />
        </div>
        <div className="space-y-3 rounded-xl border border-border/80 bg-card/50 p-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="mx-auto h-4 w-48" />
      </div>
    </main>
  );
}

/** Default admin fallback — schedule shape (most common entry). */
export function AdminScheduleSkeleton() {
  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-8 w-36" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-28 rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border/70 bg-card/40 p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
            <Skeleton className="mt-3 h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </main>
  );
}

export function AdminQuestsSkeleton() {
  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <ul className="space-y-2">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="rounded-xl border border-border/70 bg-card/40 p-3"
          >
            <div className="flex items-start gap-2 sm:gap-3">
              <Skeleton className="mt-1 size-10 shrink-0 rounded-md sm:size-8" />
              <Skeleton className="h-16 w-16 shrink-0 rounded-md sm:h-[4.5rem] sm:w-[4.5rem]" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-3.5 w-32" />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

export function AdminHelpSkeleton() {
  return (
    <main className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="space-y-4 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-5 sm:px-5">
        <Skeleton className="h-4 w-36 bg-amber-700/20" />
        <Skeleton className="h-7 w-52 bg-amber-700/25" />
        <Skeleton className="h-4 w-full bg-amber-700/15" />
        <Skeleton className="h-4 w-5/6 bg-amber-700/15" />
        <Skeleton className="h-8 w-36 rounded-md bg-amber-700/30" />
      </div>
      <div className="space-y-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2 border-b border-border/60 pb-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ))}
      </div>
    </main>
  );
}

export function AdminFeedbackSkeleton() {
  return (
    <main className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32 bg-amber-500/25" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="space-y-3 rounded-xl border border-border/70 bg-card/40 p-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="space-y-3 rounded-xl border border-border/70 bg-card/40 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export function AdminActorsSkeleton() {
  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)]">
        <ul className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/40 p-3"
            >
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3.5 w-28" />
              </div>
              <Skeleton className="h-8 w-20" />
            </li>
          ))}
        </ul>
        <div className="space-y-3 rounded-xl border border-border/70 bg-card/40 p-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </main>
  );
}
