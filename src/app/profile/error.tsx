"use client";

import { RouteLoadError } from "@/components/loading/route-load-error";

export default function ProfileError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6">
      <h1 className="mb-6 font-heading text-2xl font-semibold">Профиль</h1>
      <RouteLoadError reset={reset} />
    </main>
  );
}
