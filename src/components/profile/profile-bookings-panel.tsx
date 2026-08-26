"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { BookingStatusBadge } from "@/components/booking-status";
import { PayBookingButton } from "@/components/profile/pay-booking-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRu } from "@/lib/locale";
import { cn } from "@/lib/utils";

export type ProfileBookingRow = {
  id: string;
  status: string;
  expiresAt: string | null;
  slot: {
    startTime: string;
    quest: { title: string; city?: { name: string; slug: string } | null };
  };
};

type Filter = "active" | "cancelled" | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "active", label: "Активные" },
  { id: "cancelled", label: "Отменённые" },
  { id: "all", label: "Все" },
];

function isCancelled(status: string) {
  return status === "CANCELLED";
}

function isActive(status: string) {
  return status === "PENDING" || status === "PAID";
}

type Props = {
  bookings: ProfileBookingRow[];
};

export function ProfileBookingsPanel({ bookings: initial }: Props) {
  const [bookings, setBookings] = useState(initial);
  const [filter, setFilter] = useState<Filter>("active");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const counts = useMemo(() => {
    let active = 0;
    let cancelled = 0;
    for (const b of bookings) {
      if (isCancelled(b.status)) cancelled += 1;
      else if (isActive(b.status)) active += 1;
    }
    return { active, cancelled, all: bookings.length };
  }, [bookings]);

  const visible = useMemo(() => {
    if (filter === "active") return bookings.filter((b) => isActive(b.status));
    if (filter === "cancelled") {
      return bookings.filter((b) => isCancelled(b.status));
    }
    return bookings;
  }, [bookings, filter]);

  const cancelledVisible = visible.filter((b) => isCancelled(b.status));
  const showSelect = filter === "cancelled" || filter === "all";

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllCancelledVisible = () => {
    const ids = cancelledVisible.map((b) => b.id);
    const allOn = ids.length > 0 && ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOn) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const selectedCancelledIds = [...selected].filter((id) =>
    bookings.some((b) => b.id === id && isCancelled(b.status))
  );

  const deleteSelected = async () => {
    if (selectedCancelledIds.length === 0 || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/bookings/delete-cancelled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedCancelledIds }),
      });
      const data = (await res.json().catch(() => null)) as
        | { success?: boolean; deleted?: number; error?: string }
        | null;
      if (!res.ok || data?.error) {
        toast.error(data?.error ?? "Не удалось удалить. Попробуйте ещё раз.");
        return;
      }
      const removed = new Set(selectedCancelledIds);
      setBookings((rows) => rows.filter((b) => !removed.has(b.id)));
      setSelected(new Set());
      toast.success(
        data?.deleted === 1
          ? "Бронирование удалено"
          : `Удалено: ${data?.deleted ?? selectedCancelledIds.length}`
      );
    } catch {
      toast.error("Не удалось удалить. Попробуйте ещё раз.");
    } finally {
      setDeleting(false);
    }
  };

  const deleteAllCancelled = async () => {
    const ids = bookings.filter((b) => isCancelled(b.status)).map((b) => b.id);
    if (ids.length === 0 || deleting) return;
    setSelected(new Set(ids));
    setDeleting(true);
    try {
      const res = await fetch("/api/bookings/delete-cancelled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = (await res.json().catch(() => null)) as
        | { success?: boolean; deleted?: number; error?: string }
        | null;
      if (!res.ok || data?.error) {
        toast.error(data?.error ?? "Не удалось удалить. Попробуйте ещё раз.");
        return;
      }
      setBookings((rows) => rows.filter((b) => !isCancelled(b.status)));
      setSelected(new Set());
      toast.success(`Удалено отменённых: ${data?.deleted ?? ids.length}`);
    } catch {
      toast.error("Не удалось удалить. Попробуйте ещё раз.");
    } finally {
      setDeleting(false);
    }
  };

  if (bookings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        У вас пока нет бронирований.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div
          className="inline-flex flex-wrap gap-1 rounded-lg border border-border/70 bg-background/40 p-1"
          role="tablist"
          aria-label="Фильтр бронирований"
        >
          {FILTERS.map((item) => {
            const count =
              item.id === "active"
                ? counts.active
                : item.id === "cancelled"
                  ? counts.cancelled
                  : counts.all;
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setFilter(item.id);
                  setSelected(new Set());
                }}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
                <Badge
                  variant={active ? "default" : "outline"}
                  className="ml-1.5 h-5 min-w-5 px-1"
                >
                  {count}
                </Badge>
              </button>
            );
          })}
        </div>

        {counts.cancelled > 0 ? (
          <div className="flex flex-wrap gap-2">
            {showSelect && selectedCancelledIds.length > 0 ? (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={deleting}
                onClick={() => void deleteSelected()}
              >
                {deleting
                  ? "Удаление…"
                  : `Удалить выбранные (${selectedCancelledIds.length})`}
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={deleting}
              onClick={() => void deleteAllCancelled()}
            >
              Удалить все отменённые
            </Button>
          </div>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {filter === "active"
            ? "Нет активных бронирований."
            : filter === "cancelled"
              ? "Нет отменённых бронирований."
              : "Список пуст."}
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {showSelect && cancelledVisible.length > 0 ? (
              <li className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={
                    cancelledVisible.length > 0 &&
                    cancelledVisible.every((b) => selected.has(b.id))
                  }
                  onChange={toggleAllCancelledVisible}
                  disabled={deleting}
                />
                Выбрать все отменённые на экране
              </li>
            ) : null}
            {visible.map((booking) => (
              <li
                key={booking.id}
                className="rounded-lg border border-border/70 bg-background/30 p-3"
              >
                <div className="flex items-start gap-2">
                  {showSelect && isCancelled(booking.status) ? (
                    <input
                      type="checkbox"
                      className="mt-1 size-4 shrink-0 accent-primary"
                      checked={selected.has(booking.id)}
                      disabled={deleting}
                      onChange={() => toggle(booking.id)}
                      aria-label={`Выбрать ${booking.slot.quest.title}`}
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium leading-snug">
                        {booking.slot.quest.city?.name
                          ? `${booking.slot.quest.city.name} · ${booking.slot.quest.title}`
                          : booking.slot.quest.title}
                      </p>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatRu(new Date(booking.slot.startTime), "d MMM yyyy, HH:mm")}
                    </p>
                    {booking.status === "PENDING" ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <PayBookingButton bookingId={booking.id} />
                        {booking.expiresAt ? (
                          <span className="text-[11px] text-muted-foreground">
                            до {formatRu(new Date(booking.expiresAt), "HH:mm")}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden md:block">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  {showSelect ? (
                    <TableHead className="w-10">
                      {cancelledVisible.length > 0 ? (
                        <input
                          type="checkbox"
                          className="size-4 accent-primary"
                          checked={
                            cancelledVisible.length > 0 &&
                            cancelledVisible.every((b) => selected.has(b.id))
                          }
                          onChange={toggleAllCancelledVisible}
                          disabled={deleting}
                          aria-label="Выбрать все отменённые"
                        />
                      ) : null}
                    </TableHead>
                  ) : null}
                  <TableHead className="w-[28%]">Квест</TableHead>
                  <TableHead className="w-[32%]">Слот</TableHead>
                  <TableHead className="w-[22%]">Статус</TableHead>
                  <TableHead className="w-[18%]">Оплата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((booking) => (
                  <TableRow key={booking.id}>
                    {showSelect ? (
                      <TableCell>
                        {isCancelled(booking.status) ? (
                          <input
                            type="checkbox"
                            className="size-4 accent-primary"
                            checked={selected.has(booking.id)}
                            disabled={deleting}
                            onChange={() => toggle(booking.id)}
                            aria-label={`Выбрать ${booking.slot.quest.title}`}
                          />
                        ) : null}
                      </TableCell>
                    ) : null}
                    <TableCell className="max-w-0 font-medium">
                      <span className="line-clamp-2">
                        {booking.slot.quest.city?.name
                          ? `${booking.slot.quest.city.name} · ${booking.slot.quest.title}`
                          : booking.slot.quest.title}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRu(new Date(booking.slot.startTime), "d MMM yyyy, HH:mm")}
                    </TableCell>
                    <TableCell>
                      <BookingStatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell>
                      {booking.status === "PENDING" ? (
                        <div className="flex flex-col items-start gap-1">
                          <PayBookingButton bookingId={booking.id} />
                          {booking.expiresAt ? (
                            <span className="text-[11px] text-muted-foreground">
                              до {formatRu(new Date(booking.expiresAt), "HH:mm")}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
