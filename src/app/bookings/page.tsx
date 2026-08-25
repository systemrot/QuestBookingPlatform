import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { BookingStatusBadge } from "@/components/booking-status";
import { PayBookingButton } from "@/components/profile/pay-booking-button";
import { SyncPendingHold } from "@/components/sync-pending-hold";
import { resolveBookingStatus } from "@/lib/booking-policy";
import { getUserBookings } from "@/lib/data";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatRub, formatRu } from "@/lib/locale";
import {
  clearPendingHoldMemory,
  rememberPendingHoldMemory,
} from "@/lib/pending-hold";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const now = new Date();
  const bookings = (await getUserBookings(userId)).map((b) => ({
    ...b,
    status: resolveBookingStatus(b.status, b.expiresAt, now),
  }));

  // Cookie нельзя писать из Server Component — только память процесса + SyncPendingHold на клиенте.
  const pending = bookings.find((b) => b.status === "PENDING" && b.expiresAt);
  if (pending?.expiresAt) {
    rememberPendingHoldMemory(userId, pending.expiresAt);
  } else {
    clearPendingHoldMemory(userId);
  }

  const pendingExpiresIso = pending?.expiresAt
    ? pending.expiresAt.toISOString()
    : null;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
      <SyncPendingHold expiresAtIso={pendingExpiresIso} />
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Мои бронирования</h1>
          <p className="text-sm text-muted-foreground">
            Неоплаченная бронь держит слот 20 минут. Одновременно активен один
            холд — новая бронь заменяет предыдущую. После оплаты депозита время
            закреплено за вами.
          </p>
        </div>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          К каталогу
        </Link>
      </div>

      {bookings.length === 0 ? (
        <Card className="border-dashed border-border/80 bg-muted/20">
          <CardHeader>
            <CardTitle className="text-base">Бронирований пока нет</CardTitle>
            <CardDescription>
              Выберите квест на главной странице и забронируйте свободный слот.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/" className={cn(buttonVariants())}>
              Смотреть квесты
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {bookings.map((b) => (
            <li key={b.id}>
              <Card className="border-border/80 bg-card/50">
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{b.slot.quest.title}</CardTitle>
                    <CardDescription>
                      {formatRu(b.slot.startTime, "EEE, d MMMM, HH:mm")}{" "}
                      –{" "}
                      {formatRu(b.slot.endTime, "HH:mm")}
                    </CardDescription>
                  </div>
                  <BookingStatusBadge status={b.status} />
                </CardHeader>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Стоимость слота{" "}
                    <span className="font-medium text-foreground">
                      {formatRub(Number(b.slot.price))}
                    </span>
                    {b.status === "PENDING" && b.expiresAt ? (
                      <>
                        {" "}
                        · оплатите до{" "}
                        <span className="font-medium text-foreground">
                          {formatRu(b.expiresAt, "HH:mm")}
                        </span>
                      </>
                    ) : null}
                  </p>
                  {b.status === "PENDING" ? (
                    <PayBookingButton bookingId={b.id} />
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
