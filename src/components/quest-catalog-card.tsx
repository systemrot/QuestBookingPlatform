"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { format, isBefore, startOfToday } from "date-fns";

import { createBooking, getAvailableSlots, type SlotOption } from "@/app/actions/booking";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRub, formatRu, ruLocale } from "@/lib/locale";
import { cn } from "@/lib/utils";

export type QuestForCatalog = {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  price: string;
};

type SessionInfo = {
  role: "USER" | "ADMIN";
  name?: string | null;
  email?: string | null;
} | null;

export function QuestCatalogCard({
  quest,
  session,
}: {
  quest: QuestForCatalog;
  session: SessionInfo;
}) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(() => new Date());
  const [slots, setSlots] = React.useState<SlotOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [pendingSlot, setPendingSlot] = React.useState<string | null>(null);

  const loadSlots = React.useCallback(async () => {
    if (!date || !session || session.role !== "USER") return;
    setLoading(true);
    setMessage(null);
    const res = await getAvailableSlots(quest.id, format(date, "yyyy-MM-dd"));
    setLoading(false);
    if ("error" in res && res.error) {
      setSlots([]);
      setMessage(res.error);
      return;
    }
    if ("slots" in res) setSlots(res.slots);
  }, [date, quest.id, session]);

  React.useEffect(() => {
    if (open && session?.role === "USER" && date) {
      void loadSlots();
    }
  }, [open, date, session, loadSlots]);

  async function handleBook(slotId: string) {
    setPendingSlot(slotId);
    setMessage(null);
    const res = await createBooking(slotId);
    setPendingSlot(null);
    if ("error" in res && res.error) {
      setMessage(res.error);
      return;
    }
    if (res.success) {
      setOpen(false);
      setSlots([]);
      setMessage(null);
    }
  }

  return (
    <>
      <Card className="overflow-hidden border-border/60 bg-card/50 shadow-sm backdrop-blur-sm transition hover:border-primary/30 hover:shadow-md">
        <div className="relative aspect-[16/10] w-full bg-muted">
          {quest.image ? (
            <Image
              src={quest.image}
              alt={quest.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Нет изображения
            </div>
          )}
          <Badge className="absolute right-3 top-3 bg-background/90 text-foreground backdrop-blur">
            От {formatRub(quest.price)}
          </Badge>
        </div>
        <CardHeader className="gap-1">
          <CardTitle className="text-lg">{quest.title}</CardTitle>
          {quest.description && (
            <CardDescription className="line-clamp-2">{quest.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">
            Войдите в аккаунт, выберите дату и время. Слоты обновляются в реальном времени.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>
            Забронировать
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{quest.title}</DialogTitle>
            <DialogDescription>
              Выберите день и свободное время. Бронирование создается со статусом
              &nbsp;&quot;Ожидает оплаты&quot; до подключения оплаты.
            </DialogDescription>
          </DialogHeader>

          {!session && (
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <p className="mb-3 text-muted-foreground">
                Войдите как клиент, чтобы увидеть доступные слоты и оформить бронирование.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/login" className={cn(buttonVariants({ size: "sm" }))}>
                  Войти
                </Link>
                <Link
                  href="/register"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Создать аккаунт
                </Link>
              </div>
            </div>
          )}

          {session?.role === "ADMIN" && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
              Администратор не может оформить бронирование. Войдите как клиент (например,{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">user@example.com</code>),
              чтобы протестировать сценарий.
            </p>
          )}

          {session?.role === "USER" && (
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="mx-auto sm:mx-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => isBefore(d, startOfToday())}
                  locale={ruLocale}
                  className="rounded-xl border border-border/80 bg-muted/20 p-2 [--cell-size:2.25rem]"
                />
              </div>
              <div className="min-h-[200px] flex-1 space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {date ? formatRu(date, "EEEE, d MMMM") : "Выберите дату"}
                </p>
                {loading && (
                  <p className="text-sm text-muted-foreground">Загружаем слоты...</p>
                )}
                {!loading && slots.length === 0 && date && !message && (
                  <p className="text-sm text-muted-foreground">На эту дату нет свободных слотов.</p>
                )}
                <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
                  {slots.map((s) => (
                    <li key={s.id}>
                      <Button
                        variant="outline"
                        className="h-auto w-full justify-between py-2"
                        disabled={pendingSlot === s.id}
                        onClick={() => void handleBook(s.id)}
                      >
                        <span>
                          {formatRu(new Date(s.startTime), "HH:mm")} –{" "}
                          {formatRu(new Date(s.endTime), "HH:mm")}
                        </span>
                        <span className="text-muted-foreground">{formatRub(s.price)}</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {message && (
            <p className="text-sm text-destructive" role="alert">
              {message}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
