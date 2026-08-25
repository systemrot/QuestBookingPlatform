import { Skeleton } from "@/components/ui/skeleton";

export default function AdminMessagesLoading() {
  return (
    <main className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[32%_1fr]">
        <div className="rounded-xl border border-border/80 bg-card/50 p-4">
          <Skeleton className="mb-3 h-5 w-24" />
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
        <div className="rounded-xl border border-border/80 bg-card/50 p-4">
          <Skeleton className="mb-3 h-5 w-40" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Загрузка сообщений…</p>
    </main>
  );
}
