import { Skeleton } from "@/components/ui/skeleton";

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

export function CatalogPageSkeleton() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-4 py-12 sm:px-6">
      <section className="space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-full max-w-2xl" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </section>
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-16" />
        </div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <li key={i} className="overflow-hidden rounded-xl border border-border/60 bg-card/50">
              <Skeleton className="aspect-[16/10] w-full rounded-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="px-4 pb-4">
                <Skeleton className="ml-auto h-8 w-28" />
              </div>
            </li>
          ))}
        </ul>
      </section>
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
