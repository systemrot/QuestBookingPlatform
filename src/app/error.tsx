"use client";

import { RouteLoadError } from "@/components/loading/route-load-error";

export default function HomeError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6">
      <h1 className="font-heading text-2xl font-semibold">Каталог квестов</h1>
      <RouteLoadError reset={reset} />
    </main>
  );
}
