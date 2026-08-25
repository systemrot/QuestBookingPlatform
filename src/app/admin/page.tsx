import Link from "next/link";

import { AssignActorsPicker } from "@/components/admin/assign-actors-picker";
import { BookingAdminActions } from "@/components/admin/booking-admin-actions";
import { BookingStatusBadge } from "@/components/booking-status";
import { buttonVariants } from "@/components/ui/button-variants";
import { getAdminPageData } from "@/lib/data";
import { formatRu } from "@/lib/locale";
import { displayRuPhoneFromStored } from "@/lib/ru-phone";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { actors, bookedSlots } = await getAdminPageData();

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold">Расписание</h1>
          <p className="text-sm text-muted-foreground">
            Активные брони и холды. Параллельных сеансов нет — одно время на
            всю площадку.
          </p>
        </div>
        <Link
          href="/admin/reports"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Отчёты и выплаты
        </Link>
      </div>

      {bookedSlots.length === 0 ? (
        <Card className="border-dashed border-border/80 bg-card/40">
          <CardHeader>
            <CardTitle className="text-base">Активных броней нет</CardTitle>
            <CardDescription>
              Когда клиент забронирует слот, он появится здесь.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {bookedSlots.map((slot) => {
            const booking = slot.bookings[0];
            return (
              <li key={slot.id}>
                <Card className="border-border/80 bg-card/50">
                  <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-heading text-base font-semibold leading-snug">
                            {slot.quest.title}
                          </h2>
                          {booking?.status ? (
                            <BookingStatusBadge status={booking.status} />
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatRu(slot.startTime, "EEEE, d MMMM · HH:mm")}
                          {" – "}
                          {formatRu(slot.endTime, "HH:mm")}
                        </p>
                        {booking?.createdAt ? (
                          <p className="text-xs text-muted-foreground/80">
                            Забронировано{" "}
                            {formatRu(booking.createdAt, "d MMM, HH:mm")}
                          </p>
                        ) : null}
                      </div>
                      {booking ? (
                        <div className="shrink-0">
                          <BookingAdminActions
                            bookingId={booking.id}
                            status={booking.status}
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="grid gap-4 border-t border-border/60 pt-4 sm:grid-cols-2">
                      <div className="min-w-0 space-y-1">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Клиент
                        </p>
                        {booking ? (
                          <>
                            <p className="font-medium leading-snug">
                              {booking.user.name}
                            </p>
                            <p className="truncate text-sm text-muted-foreground">
                              {booking.user.email}
                            </p>
                            {booking.user.phone ? (
                              <p className="text-sm text-muted-foreground">
                                {displayRuPhoneFromStored(booking.user.phone)}
                              </p>
                            ) : null}
                            {booking.status === "PENDING" && booking.expiresAt ? (
                              <p className="pt-1 text-xs text-amber-200/90">
                                Холд до {formatRu(booking.expiresAt, "HH:mm")}
                              </p>
                            ) : null}
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">—</p>
                        )}
                      </div>

                      <div className="min-w-0 space-y-2">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Актёры
                        </p>
                        <AssignActorsPicker
                          key={`${slot.id}:${slot.assignments
                            .map((a) => a.actorId)
                            .sort()
                            .join(",")}`}
                          slotId={slot.id}
                          actors={actors}
                          assignedActors={slot.assignments.map((a) => ({
                            id: a.actor.id,
                            name: a.actor.name,
                          }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
