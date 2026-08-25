import { Skeleton } from "@/components/ui/skeleton";

export default function AdminReportsLoading() {
  return (
    <main className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="rounded-xl border border-border/80 bg-card/50 p-6">
        <Skeleton className="mb-4 h-6 w-48" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Загрузка отчётов…</p>
    </main>
  );
}
