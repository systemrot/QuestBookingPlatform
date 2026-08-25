"use client";

import { RouteLoadError } from "@/components/loading/route-load-error";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Панель администратора</h1>
      <RouteLoadError reset={reset} />
    </main>
  );
}
