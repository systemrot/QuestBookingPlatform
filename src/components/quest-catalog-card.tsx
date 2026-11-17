"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import {
  createBookingRequest,
  getAvailableSlots,
  type SlotOption,
} from "@/app/actions/booking";
import {
  MAX_PARTY_SIZE,
  listBookableDays,
  listScheduleStarts,
  makeVirtualSlotId,
  moscowDateTime,
  slotEndTime,
  toMoscowDateKey,
} from "@/lib/booking-policy";
import {
  clampEmailInput,
  clampNameInput,
  FIELD_LIMITS,
} from "@/lib/field-limits";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RuPhoneInput } from "@/components/ui/ru-phone-input";
import { BloodBrushDrips } from "@/components/blood-brush-drips";
import { PartySizeStepper } from "@/components/party-size-stepper";
import {
  QuestCardProp,
  type QuestPropVariant,
} from "@/components/quest-card-prop";
import { QuestDescriptionView } from "@/components/quest-description";
import { formatRub, formatRu } from "@/lib/locale";
import { questDescriptionTeaser } from "@/lib/quest-description";
import { resolveQuestImage } from "@/lib/quest-image";
import { fallbackQuestImageAlt } from "@/lib/quest-image-alt";
import { displayRuPhoneFromStored } from "@/lib/ru-phone";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type FieldErrors = {
  name?: string;
  phone?: string;
  partySize?: string;
  email?: string;
};

function validateRequestFields(input: {
  name: string;
  phoneE164: string | null;
  partySize: number;
  email: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const name = input.name.trim();
  if (name.length < 2) {
    errors.name = "Укажите имя (минимум 2 символа)";
  } else if (name.length > FIELD_LIMITS.name.max) {
    errors.name = `Имя не длиннее ${FIELD_LIMITS.name.max} символов`;
  }

  if (!input.phoneE164) {
    errors.phone = "Укажите полный мобильный: +7 (9XX) XXX-XX-XX";
  }

  if (
    !Number.isInteger(input.partySize) ||
    input.partySize < 1 ||
    input.partySize > MAX_PARTY_SIZE
  ) {
    errors.partySize = `Выберите число людей от 1 до ${MAX_PARTY_SIZE}`;
  }

  const email = input.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Некорректный email";
  }

  return errors;
}

export type QuestForCatalog = {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  imageAlt?: string | null;
  cityName?: string | null;
  price: string;
  /** Decorative corner prop (0–2 originals, 3+ new quests). */
  propVariant?: QuestPropVariant;
};

type SessionInfo = {
  role: "USER" | "ADMIN" | "OWNER";
  name?: string | null;
  email?: string | null;
} | null;

const QUEST_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=1200&q=80";

function resolveQuestImageSrc(src: string | null | undefined) {
  return resolveQuestImage(src) ?? QUEST_IMAGE_FALLBACK;
}

type Step = "schedule" | "details" | "success";

export function QuestCatalogCard({
  quest,
  session,
}: {
  quest: QuestForCatalog;
  session: SessionInfo;
}) {
  const propVariant = (quest.propVariant ?? 0) as QuestPropVariant;
  const bookableDays = React.useMemo(() => listBookableDays(), []);
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<Step>("schedule");
  const [date, setDate] = React.useState<Date | undefined>(() => listBookableDays()[0]);
  const [slots, setSlots] = React.useState<SlotOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedSlot, setSelectedSlot] = React.useState<SlotOption | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [imageSrc, setImageSrc] = React.useState(() =>
    resolveQuestImageSrc(quest.image)
  );

  const [name, setName] = React.useState("");
  const [phoneE164, setPhoneE164] = React.useState<string | null>(null);
  const [partySize, setPartySize] = React.useState(2);
  const [email, setEmail] = React.useState("");
  const [submitAttempted, setSubmitAttempted] = React.useState(false);
  const [touched, setTouched] = React.useState<{
    name?: boolean;
    phone?: boolean;
    email?: boolean;
  }>({});

  const description =
    quest.description?.trim() ||
    "Выберите удобный день и время — менеджер свяжется для подтверждения.";
  const cardTeaser = questDescriptionTeaser(quest.description) || description;
  const canBook = !session || session.role === "USER";
  const coverAlt =
    quest.imageAlt?.trim() ||
    fallbackQuestImageAlt(quest.title, quest.cityName);

  React.useEffect(() => {
    setImageSrc(resolveQuestImageSrc(quest.image));
  }, [quest.image]);

  React.useEffect(() => {
    if (!open) return;
    if (session?.role === "USER") {
      if (session.name) setName((v) => v || session.name || "");
      if (session.email) setEmail((v) => v || session.email || "");
    }
  }, [open, session]);

  const loadSlots = React.useCallback(async () => {
    if (!date || !canBook) return;

    const dateStr = toMoscowDateKey(date);
    const [y, m, d] = dateStr.split("-").map(Number);
    const dayFrom = moscowDateTime(y, m, d, 0, 0);
    const dayTo = moscowDateTime(y, m, d, 23, 59);
    const now = new Date();

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
  }, [date, quest.id, quest.price, canBook]);

  React.useEffect(() => {
    if (open && canBook && date && step === "schedule") {
      void loadSlots();
    }
  }, [open, date, canBook, step, loadSlots]);

  function resetFlow() {
    setStep("schedule");
    setSelectedSlot(null);
    setSubmitting(false);
    setSubmitAttempted(false);
    setTouched({});
  }

  function pickSlot(slot: SlotOption) {
    setSelectedSlot(slot);
    setStep("details");
    setSubmitAttempted(false);
    setTouched({});
  }

  const liveErrors = validateRequestFields({
    name,
    phoneE164,
    partySize,
    email,
  });

  function showError(field: keyof FieldErrors) {
    if (field === "partySize") {
      return submitAttempted ? liveErrors.partySize : undefined;
    }
    if (touched[field] || submitAttempted) return liveErrors[field];
    return undefined;
  }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot || submitting) return;

    setSubmitAttempted(true);
    setTouched({ name: true, phone: true, email: true });
    const errors = validateRequestFields({
      name,
      phoneE164,
      partySize,
      email,
    });
    if (Object.keys(errors).length > 0) {
      toast.error("Проверьте поля формы");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createBookingRequest({
        slotId: selectedSlot.id,
        name,
        phone: phoneE164!,
        partySize,
        email: email.trim() || undefined,
      });
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      setStep("success");
    } catch {
      toast.error("Не удалось отправить заявку. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="group/quest relative flex h-full flex-col pb-6 sm:pb-7">
        <Card className="quest-card-horror group/card flex h-full flex-col gap-0 overflow-visible rounded-none bg-transparent py-0 ring-0">
          <div
            role="button"
            tabIndex={0}
            className="relative z-[1] flex w-full flex-1 flex-col cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-blood/60 focus-visible:ring-inset"
            onClick={(e) => {
              (e.currentTarget as HTMLElement).blur();
              setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                (e.currentTarget as HTMLElement).blur();
                setOpen(true);
              }
            }}
            aria-label={`Подробнее о квесте «${quest.title}»`}
          >
            <div className="quest-card-media relative aspect-[16/12] w-full shrink-0 overflow-hidden bg-[oklch(0.1_0.012_25)]">
              <Image
                src={imageSrc}
                alt={coverAlt}
                fill
                className="quest-card-media-img object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={() => {
                  if (imageSrc !== QUEST_IMAGE_FALLBACK) {
                    setImageSrc(QUEST_IMAGE_FALLBACK);
                  }
                }}
              />
              <div className="quest-card-media-wash pointer-events-none absolute inset-0" />
              <div className="quest-card-media-fade pointer-events-none absolute inset-0" />
              <div className="pointer-events-none absolute inset-0 z-[2] shadow-[inset_0_0_48px_rgba(0,0,0,0.55)]" />
            </div>
            <span className="quest-price-badge">
              От {formatRub(quest.price)}
            </span>
            <CardHeader className="relative z-[2] -mt-10 flex flex-1 flex-col gap-2.5 bg-gradient-to-b from-transparent from-0% via-[oklch(0.1_0.012_25)] via-[28%] to-[oklch(0.1_0.012_25)] px-4 pb-1.5 pt-2 sm:-mt-12">
              <CardTitle className="quest-card-title min-h-[2.1em] text-[1.2rem] sm:text-[1.28rem]">
                {quest.title}
              </CardTitle>
              <CardDescription className="quest-card-desc min-h-[3.9em] line-clamp-3 text-[14px] leading-snug text-white/72">
                {cardTeaser || "\u00a0"}
              </CardDescription>
            </CardHeader>
          </div>
          <CardFooter className="relative z-[1] mt-auto flex items-center justify-start border-0 bg-[oklch(0.1_0.012_25)] px-4 pb-6 pt-2 lg:pb-7 lg:pr-20">
            <Button
              className="btn-blood-brush h-auto min-h-11 w-auto min-w-[10.75rem] justify-center px-5 text-sm"
              onClick={(e) => {
                e.currentTarget.blur();
                setOpen(true);
              }}
            >
              <BloodBrushDrips
                variant={
                  (["a", "b", "c"] as const)[Number(propVariant) % 3]
                }
              />
              Оставить заявку
              <span data-brush-arrow aria-hidden>
                →
              </span>
            </Button>
          </CardFooter>
        </Card>
        <div className="quest-card-prop-wrap pointer-events-none absolute -bottom-2 -right-4 z-20 hidden rotate-[10deg] lg:block">
          <QuestCardProp variant={propVariant} />
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetFlow();
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
              <div className="relative aspect-[16/11] w-full bg-muted sm:aspect-[16/10] sm:min-h-[18.5rem]">
                <Image
                  src={imageSrc}
                  alt={coverAlt}
                  fill
                  className="object-cover object-[center_18%] sm:object-[center_22%]"
                  sizes="(max-width: 768px) 100vw, 576px"
                />
                {/* Soft veil: solid only at the very bottom for type, then opens up so cover stays visible. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-popover from-[6%] via-popover/50 via-[32%] to-transparent to-[62%]"
                />
                <Badge className="absolute left-3 top-3 z-[1] bg-background/90 text-foreground backdrop-blur">
                  От {formatRub(quest.price)}
                </Badge>
              </div>

              <div className="relative z-[1] -mt-14 flex min-h-0 flex-col gap-3.5 overflow-x-hidden px-4 pb-4 pt-0 sm:-mt-[4.75rem] sm:gap-4 sm:px-5 sm:pb-5">
                <DialogHeader className="gap-2 text-left">
                  <DialogTitle className="quest-card-title font-sans pr-8 text-xl font-bold leading-snug tracking-[0.04em] [text-shadow:0_1px_18px_rgba(0,0,0,0.55)] sm:text-2xl">
                    {quest.title}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    {cardTeaser}
                  </DialogDescription>
                  <QuestDescriptionView
                    text={description}
                    measureKey={open}
                  />
                </DialogHeader>

                <div className="min-w-0 space-y-3 overflow-x-hidden rounded-xl border border-border/60 bg-muted/25 p-3 sm:p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {step === "schedule"
                      ? "Желаемое время"
                      : step === "details"
                        ? "Контакты"
                        : "Готово"}
                  </p>

                  {(session?.role === "ADMIN" || session?.role === "OWNER") && (
                    <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                      Администратор не может оставить заявку. Войдите как клиент
                      или выйдите из аккаунта.
                    </p>
                  )}

                  {canBook && step === "schedule" && (
                    <div className="min-w-0 space-y-4 overflow-x-hidden">
                      <p className="text-sm text-muted-foreground">
                        Выберите удобные дату и время — это пожелание. Менеджер
                        подтвердит запись по телефону.
                      </p>

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
                              date != null &&
                              toMoscowDateKey(day) === toMoscowDateKey(date);
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
                                    selected
                                      ? "text-background/70"
                                      : "text-muted-foreground"
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
                            На эту дату нет подходящих окон.
                          </p>
                        )}

                        {slots.length > 0 ? (
                          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {slots.map((s) => (
                              <li key={s.id} className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => pickSlot(s)}
                                  className={cn(
                                    "flex w-full flex-col items-start gap-0.5 rounded-lg border border-border/80 bg-background/50 px-3 py-2.5 text-left",
                                    "outline-none transition-colors",
                                    "hover:border-foreground/30 hover:bg-foreground/[0.06]"
                                  )}
                                >
                                  <span className="text-base font-medium tabular-nums text-foreground">
                                    {formatRu(new Date(s.startTime), "HH:mm")}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    выбрать
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {canBook && step === "details" && selectedSlot && (
                    <form className="space-y-4" onSubmit={(e) => void submitRequest(e)}>
                      <div className="rounded-lg border border-border/70 bg-background/40 px-3 py-2.5 text-sm">
                        <p className="text-muted-foreground">Желаемое время</p>
                        <p className="font-medium text-foreground">
                          {formatRu(new Date(selectedSlot.startTime), "EEEE, d MMMM, HH:mm")}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor={`req-name-${quest.id}`}>Имя</Label>
                          <Input
                            id={`req-name-${quest.id}`}
                            value={name}
                            onChange={(e) => setName(clampNameInput(e.target.value))}
                            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                            placeholder="Как к вам обращаться"
                            autoComplete="name"
                            autoCapitalize="words"
                            maxLength={FIELD_LIMITS.name.max}
                            aria-invalid={Boolean(showError("name"))}
                          />
                          {showError("name") ? (
                            <p className="text-xs text-destructive">{showError("name")}</p>
                          ) : null}
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor={`req-phone-${quest.id}`}>Телефон</Label>
                          <RuPhoneInput
                            id={`req-phone-${quest.id}`}
                            value={phoneE164}
                            onValueChange={setPhoneE164}
                            onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                            aria-invalid={Boolean(showError("phone"))}
                          />
                          {showError("phone") ? (
                            <p className="text-xs text-destructive">{showError("phone")}</p>
                          ) : (
                            <p className="text-[11px] text-muted-foreground">
                              Мобильный номер для связи с менеджером
                            </p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label id={`req-party-label-${quest.id}`}>
                            Количество людей
                          </Label>
                          <PartySizeStepper
                            value={partySize}
                            min={1}
                            max={MAX_PARTY_SIZE}
                            onChange={setPartySize}
                            aria-labelledby={`req-party-label-${quest.id}`}
                            aria-invalid={Boolean(showError("partySize"))}
                          />
                          {showError("partySize") ? (
                            <p className="text-xs text-destructive">
                              {showError("partySize")}
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor={`req-email-${quest.id}`}>
                            Email{" "}
                            <span className="font-normal text-muted-foreground">
                              (необязательно)
                            </span>
                          </Label>
                          <Input
                            id={`req-email-${quest.id}`}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(clampEmailInput(e.target.value))}
                            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                            placeholder="you@example.com"
                            autoComplete="email"
                            maxLength={FIELD_LIMITS.email.max}
                            aria-invalid={Boolean(showError("email"))}
                          />
                          {showError("email") ? (
                            <p className="text-xs text-destructive">{showError("email")}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={submitting}
                          onClick={() => {
                            setStep("schedule");
                            setSelectedSlot(null);
                            setSubmitAttempted(false);
                            setTouched({});
                          }}
                        >
                          Назад
                        </Button>
                        <Button type="submit" disabled={submitting}>
                          {submitting ? "Отправляем…" : "Оставить заявку"}
                        </Button>
                      </div>
                    </form>
                  )}

                  {canBook && step === "success" && selectedSlot && (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
                        <p className="font-medium text-foreground">
                          Заявка принята
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          Ожидайте связи с менеджером. Мы перезвоним, чтобы
                          подтвердить время и детали.
                        </p>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          <span className="text-foreground">Время:</span>{" "}
                          {formatRu(
                            new Date(selectedSlot.startTime),
                            "d MMMM, HH:mm"
                          )}
                        </p>
                        <p>
                          <span className="text-foreground">Телефон:</span>{" "}
                          {displayRuPhoneFromStored(phoneE164)}
                        </p>
                        <p>
                          <span className="text-foreground">Людей:</span> {partySize}
                        </p>
                      </div>
                      {!session ? (
                        <p className="text-xs text-muted-foreground">
                          Чтобы видеть заявки и отменять их сами,{" "}
                          <Link href="/login" className="underline underline-offset-2">
                            войдите
                          </Link>{" "}
                          или{" "}
                          <Link
                            href="/register"
                            className="underline underline-offset-2"
                          >
                            создайте аккаунт
                          </Link>
                          .
                        </p>
                      ) : (
                        <Link
                          href="/bookings"
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        >
                          Мои заявки
                        </Link>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          resetFlow();
                          setOpen(false);
                        }}
                      >
                        Закрыть
                      </Button>
                    </div>
                  )}
                </div>

                {step === "schedule" ? (
                  <p className="text-xs text-muted-foreground">
                    Время на сайте — пожелание. Финальную запись подтвердит
                    менеджер по телефону.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
