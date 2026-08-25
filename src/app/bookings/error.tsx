"use client";

import { RouteLoadError } from "@/components/loading/route-load-error";

export default function BookingsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
      <h1 className="mb-6 font-heading text-2xl font-semibold">Мои бронирования</h1>
      <RouteLoadError reset={reset} />
    </main>
  );
}
