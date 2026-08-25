"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { createBooking, getAvailableSlots, type SlotOption } from "@/app/actions/booking";
import { getViewerSession, type ViewerSession } from "@/app/actions/session";
import {
  listBookableDays,
  listScheduleStarts,
  makeVirtualSlotId,
  moscowDateTime,
  slotEndTime,
  toMoscowDateKey,
} from "@/lib/booking-policy";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookingCareProgress } from "@/components/booking-care-progress";
import { formatRub, formatRu } from "@/lib/locale";
import {
  clearClientPendingHold,
  setClientPendingHold,
} from "@/lib/pending-hold-client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type QuestForCatalog = {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  price: string;
};

type SessionInfo = ViewerSession | null;

const QUEST_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=1200&q=80";

export function QuestCatalogCard({
  quest,
  session: initialSession = null,
}: {
  quest: QuestForCatalog;
  session?: SessionInfo;
}) {
  const router = useRouter();
  const { data: clientSession } = useSession();
  const bookableDays = React.useMemo(() => listBookableDays(), []);
  const [open, setOpen] = React.useState(false);
  const [viewerSession, setViewerSession] = React.useState<SessionInfo>(null);
  const [sessionLoading, setSessionLoading] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(() => listBookableDays()[0]);
  const [slots, setSlots] = React.useState<SlotOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [pendingSlot, setPendingSlot] = React.useState<string | null>(null);
  const [descExpanded, setDescExpanded] = React.useState(false);
  const [imageSrc, setImageSrc] = React.useState(quest.image ?? QUEST_IMAGE_FALLBACK);

  const description =
    quest.description?.trim() ||
    "Выберите удобный день и время — слоты обновляются в реальном времени.";
  const descriptionLong = description.length > 160;

  const session = React.useMemo((): SessionInfo => {
    if (viewerSession) return viewerSession;
    if (clientSession?.user?.role) {
      return {
        role: clientSession.user.role,
        name: clientSession.user.name,
        email: clientSession.user.email,
      };
    }
    return initialSession;
  }, [viewerSession, clientSession, initialSession]);

  React.useEffect(() => {
    setImageSrc(quest.image ?? QUEST_IMAGE_FALLBACK);
  }, [quest.image]);

  React.useEffect(() => {
    if (!open) {
      setViewerSession(null);
      return;
    }

    router.refresh();
    setSessionLoading(true);
    void getViewerSession()
      .then(setViewerSession)
      .finally(() => setSessionLoading(false));
  }, [open, router]);

  const loadSlots = React.useCallback(async () => {
    if (!date || !session || session.role !== "USER") return;

    const dateStr = toMoscowDateKey(date);
    const [y, m, d] = dateStr.split("-").map(Number);
    const dayFrom = moscowDateTime(y, m, d, 0, 0);
    const dayTo = moscowDateTime(y, m, d, 23, 59);
    const now = new Date();

    // Мгновенно показываем сетку из политики (без БД), потом уточняем занятость.
    const optimistic: SlotOption[] = listScheduleStarts(now)
      .filter((s) => s.getTime() >= dayFrom.getTime() && s.getTime() <= dayTo.getTime())
      .map((start) => ({
        id: makeVirtualSlotId(quest.id, start),
        startTime: start.toISOString(),
        endTime: slotEndTime(start).toISOString(),
        price: quest.price,
      }));
    setSlots(optimistic);
    setLoading(optimistic.length === 0);

    const res = await getAvailableSlots(quest.id, dateStr);
    setLoading(false);
    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    if ("slots" in res) setSlots(res.slots);
  }, [date, quest.id, quest.price, session]);

  React.useEffect(() => {
    if (open && session?.role === "USER" && date) {
      void loadSlots();
    }
  }, [open, date, session, loadSlots]);

  async function handleBook(slotId: string) {
    if (pendingSlot) return;

    // Старый клиентский флаг после снятия админом / истечения не должен мешать.
    clearClientPendingHold();

    setPendingSlot(slotId);
    setOpen(false);
    try {
      const res = await createBooking(slotId);
      if ("error" in res && res.error) {
        if ("code" in res && res.code === "PENDING_EXISTS") {
          if ("expiresAt" in res && typeof res.expiresAt === "string") {
            setClientPendingHold(res.expiresAt);
          } else {
            setClientPendingHold(new Date(Date.now() + 20 * 60_000).toISOString());
          }
        }
        toast.error(res.error);
        return;
      }
      if ("expiresAt" in res && typeof res.expiresAt === "string") {
        setClientPendingHold(res.expiresAt);
      }
      if ("replacedPreviousHold" in res && res.replacedPreviousHold) {
        toast.success("Холд обновлён", {
          description:
            "Предыдущая неоплаченная бронь снята — активен только новый слот (20 минут на оплату).",
        });
      } else {
        toast.success("Слот забронирован. Оплатите в «Мои бронирования».");
      }
      setSlots([]);
    } catch {
      toast.error("Не удалось оформить бронирование. Попробуйте ещё раз.");
    } finally {
      setPendingSlot(null);
    }
  }

  return (
    <>
      <Card className="gap-0 overflow-hidden border-border/60 bg-card/50 py-0 shadow-sm backdrop-blur-sm transition hover:border-primary/30 hover:shadow-md">
        <button
          type="button"
          className="w-full cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          onClick={() => setOpen(true)}
          aria-label={`Подробнее о квесте «${quest.title}»`}
        >
          <div className="relative aspect-[16/10] w-full bg-muted">
            <Image
              src={imageSrc}
              alt=""
              fill
              className="object-cover transition duration-300 group-hover/card:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => {
                if (imageSrc !== QUEST_IMAGE_FALLBACK) {
                  setImageSrc(QUEST_IMAGE_FALLBACK);
                }
              }}
            />
            <Badge className="absolute right-3 top-3 bg-background/90 text-foreground backdrop-blur">
              От {formatRub(quest.price)}
            </Badge>
          </div>
          <CardHeader className="gap-1.5 px-4 pt-4 pb-4">
            <CardTitle className="text-lg">{quest.title}</CardTitle>
            {quest.description && (
              <CardDescription className="line-clamp-2">{quest.description}</CardDescription>
            )}
          </CardHeader>
        </button>
        <CardFooter className="mt-auto border-t border-border/60 bg-transparent p-0">
          <Button
            className={cn(
              "h-11 w-full rounded-none rounded-b-xl",
              "bg-foreground/[0.12] font-medium tracking-wide text-foreground shadow-none",
              "hover:bg-foreground/[0.2]",
              "active:bg-foreground/[0.24]"
            )}
            onClick={() => setOpen(true)}
          >
            Забронировать
          </Button>
        </CardFooter>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setDescExpanded(false);
        }}
      >
        <DialogContent
          className={cn(
            "flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl",
            "max-h-[min(92dvh,900px)]",
            "[&_[data-slot=dialog-close]]:z-20 [&_[data-slot=dialog-close]]:bg-background/80 [&_[data-slot=dialog-close]]:backdrop-blur-sm"
          )}
        >
          <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
            <div className="relative shrink-0">
            <div className="relative h-40 w-full bg-muted sm:h-48">
              <Image
                src={imageSrc}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 576px"
              />
              {/* Длинный градиент в цвет модалки — без резкой «полосы» на стыке */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-popover from-15% via-popover/85 via-45% to-transparent to-75%" />
              <Badge className="absolute left-3 top-3 z-[1] bg-background/90 text-foreground backdrop-blur">
                От {formatRub(quest.price)}
              </Badge>
            </div>

            <div className="relative z-[1] -mt-10 flex min-h-0 flex-col gap-4 overflow-x-hidden px-4 pb-4 pt-0 sm:-mt-12 sm:px-5 sm:pb-5">
              <DialogHeader className="gap-2 text-left">
                <DialogTitle className="pr-8 text-xl leading-snug drop-shadow-sm sm:text-2xl">
                  {quest.title}
                </DialogTitle>
                <DialogDescription
                  className={cn(
                    "text-sm leading-relaxed text-muted-foreground",
                    !descExpanded && "line-clamp-2"
                  )}
                >
                  {description}
                </DialogDescription>
                {descriptionLong ? (
                  <button
                    type="button"
                    className="w-fit text-xs font-medium text-foreground/80 underline-offset-2 hover:underline"
                    onClick={() => setDescExpanded((v) => !v)}
                  >
                    {descExpanded ? "Свернуть" : "Читать полностью"}
                  </button>
                ) : null}
              </DialogHeader>

              <div className="min-w-0 space-y-3 overflow-x-hidden rounded-xl border border-border/60 bg-muted/25 p-3 sm:p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Бронирование
                </p>

                {!sessionLoading && (!session?.role || session.role !== "USER") ? (
                  session?.role === "ADMIN" ? (
                  <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                    Администратор не может оформить бронирование. Войдите как клиент.
                  </p>
                  ) : (
                  <div className="rounded-lg border border-border bg-background/40 p-3 text-sm">
                    <p className="mb-3 text-muted-foreground">
                      Войдите, чтобы выбрать дату и оформить бронирование.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href="/login?callbackUrl=%2F"
                        className={cn(buttonVariants({ size: "sm" }))}
                      >
                        Войти
                      </Link>
                      <Link
                        href="/register?callbackUrl=%2F"
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Создать аккаунт
                      </Link>
                    </div>
                  </div>
                  )
                ) : sessionLoading ? (
                  <div
                    className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                    aria-busy="true"
                    aria-label="Проверка сессии"
                  >
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-[3.25rem] animate-pulse rounded-lg bg-muted/50"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="min-w-0 space-y-4 overflow-x-hidden">
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Дата
                        <span className="font-normal normal-case tracking-normal text-muted-foreground/80">
                          {" "}
                          · ближайшие {bookableDays.length} дн.
                        </span>
                      </p>
                      <div
                        className="grid grid-cols-7 gap-1 sm:gap-1.5"
                        role="listbox"
                        aria-label="Выбор даты"
                      >
                        {bookableDays.map((day) => {
                          const selected =
                            date != null && toMoscowDateKey(day) === toMoscowDateKey(date);
                          return (
                            <button
                              key={toMoscowDateKey(day)}
                              type="button"
                              role="option"
                              aria-selected={selected}
                              onClick={() => setDate(day)}
                              className={cn(
                                "flex min-w-0 flex-col items-center gap-0.5 rounded-lg border px-0.5 py-1.5 transition-colors sm:py-2",
                                selected
                                  ? "border-foreground/40 bg-foreground text-background"
                                  : "border-border/70 bg-background/40 text-foreground hover:border-foreground/25 hover:bg-foreground/[0.06]"
                              )}
                            >
                              <span
                                className={cn(
                                  "text-[10px] uppercase leading-none",
                                  selected ? "text-background/70" : "text-muted-foreground"
                                )}
                              >
                                {formatRu(day, "EEEEEE")}
                              </span>
                              <span className="text-sm font-medium tabular-nums leading-none">
                                {formatRu(day, "d")}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="min-w-0 space-y-2 overflow-x-hidden">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {date ? formatRu(date, "EEEE, d MMMM") : "Выберите дату"}
                        <span className="font-normal normal-case tracking-normal">
                          {" "}
                          · сеанс ~60 мин
                        </span>
                      </p>

                      {loading && slots.length === 0 && (
                        <div
                          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                          aria-busy="true"
                          aria-label="Загрузка слотов"
                        >
                          {[0, 1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="h-[3.25rem] animate-pulse rounded-lg bg-muted/50"
                            />
                          ))}
                        </div>
                      )}

                      {!loading && slots.length === 0 && date && (
                        <p className="text-sm text-muted-foreground">
                          На эту дату нет свободных слотов.
                        </p>
                      )}

                      {slots.length > 0 ? (
                        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {slots.map((s) => {
                            const busy = pendingSlot === s.id;
                            return (
                              <li key={s.id} className="min-w-0">
                                <button
                                  type="button"
                                  disabled={pendingSlot !== null}
                                  onClick={() => void handleBook(s.id)}
                                  className={cn(
                                    "flex w-full flex-col items-start gap-0.5 rounded-lg border border-border/80 bg-background/50 px-3 py-2.5 text-left",
                                    "outline-none transition-colors",
                                    "hover:border-foreground/30 hover:bg-foreground/[0.06]",
                                    "disabled:cursor-not-allowed disabled:opacity-50",
                                    busy && "border-foreground/35"
                                  )}
                                >
                                  <span className="text-base font-medium tabular-nums text-foreground">
                                    {formatRu(new Date(s.startTime), "HH:mm")}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatRub(s.price)}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                После бронирования оплатите слот в «Мои бронирования» или в профиле.
              </p>
            </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BookingCareProgress
        open={pendingSlot !== null}
        questTitle={quest.title}
      />
    </>
  );
}
