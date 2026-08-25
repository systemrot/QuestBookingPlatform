"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const BOOKING_SLIDES = [
  {
    title: "Бронируем слот",
    detail: "Проверяем, что выбранное время ещё свободно, и фиксируем его за вами.",
  },
  {
    title: "Подбираем актёров",
    detail: "Смотрим, кто из ведущих может провести этот сеанс.",
  },
  {
    title: "Готовим холд",
    detail: "Резерв действует 20 минут — успеете спокойно оплатить.",
  },
  {
    title: "Почти готово",
    detail: "Сохраняем бронь и открываем путь к оплате.",
  },
] as const;

const SLIDE_MS = 2200;

type Props = {
  open: boolean;
  questTitle?: string;
};

export function BookingCareProgress({ open, questTitle }: Props) {
  const [slide, setSlide] = React.useState(0);

  React.useEffect(() => {
    if (!open) {
      setSlide(0);
      return;
    }
    const id = window.setInterval(() => {
      setSlide((i) => (i + 1) % BOOKING_SLIDES.length);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        /* Пока идёт бронь — закрыть нельзя */
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md"
        aria-busy="true"
        aria-live="polite"
      >
        <DialogHeader className="gap-3 text-center sm:text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center">
            <span className="relative flex h-10 w-10">
              <span className="absolute inset-0 animate-ping rounded-full bg-foreground/15" />
              <span className="relative m-auto h-3 w-3 rounded-full bg-foreground/80" />
            </span>
          </div>
          <DialogTitle className="text-lg">Оформляем вашу игру</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {questTitle ? (
              <>
                «{questTitle}» — обычно это быстро. Мы уже работаем над бронью.
              </>
            ) : (
              <>Обычно это быстро. Мы уже работаем над бронью.</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="relative min-h-[5.5rem] overflow-hidden rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
          {BOOKING_SLIDES.map((item, i) => (
            <div
              key={item.title}
              className={cn(
                "absolute inset-x-4 top-3 transition-all duration-500 ease-out",
                i === slide
                  ? "translate-y-0 opacity-100"
                  : i < slide
                    ? "-translate-y-3 opacity-0"
                    : "translate-y-3 opacity-0"
              )}
              aria-hidden={i !== slide}
            >
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {item.detail}
              </p>
            </div>
          ))}
        </div>

        <ol className="flex items-center justify-center gap-2" aria-label="Этапы оформления">
          {BOOKING_SLIDES.map((item, i) => (
            <li key={item.title} className="flex items-center gap-2">
              <span
                className={cn(
                  "h-1.5 w-6 rounded-full transition-colors duration-300",
                  i <= slide ? "bg-foreground/70" : "bg-foreground/15"
                )}
              />
              <span className="sr-only">
                {item.title}
                {i === slide ? " — сейчас" : i < slide ? " — готово" : ""}
              </span>
            </li>
          ))}
        </ol>

        <p className="text-center text-xs text-muted-foreground">
          Шаг {slide + 1} из {BOOKING_SLIDES.length}
          <span className="text-muted-foreground/70"> · можно подождать здесь</span>
        </p>
      </DialogContent>
    </Dialog>
  );
}
