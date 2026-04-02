import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="rounded-xl border border-border/80 bg-card/50 p-6">
        <Skeleton className="mb-2 h-6 w-40" />
        <Skeleton className="mb-4 h-4 w-72" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="rounded-xl border border-border/80 bg-card/50 p-6">
        <Skeleton className="mb-2 h-6 w-44" />
        <Skeleton className="h-4 w-64" />
      </div>
      <p className="text-xs text-muted-foreground">Загрузка панели администратора…</p>
    </main>
  );
}
