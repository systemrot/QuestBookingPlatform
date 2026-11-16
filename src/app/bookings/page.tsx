import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { BookingStatusBadge } from "@/components/booking-status";
import { CancelBookingButton } from "@/components/cancel-booking-button";
import { PayBookingButton } from "@/components/profile/pay-booking-button";
import { resolveBookingStatus } from "@/lib/booking-policy";
import { getUserBookings } from "@/lib/data";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatRub, formatRu } from "@/lib/locale";
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

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Мои заявки</h1>
          <p className="text-sm text-muted-foreground">
            Заявка — пожелание по времени. Менеджер свяжется с вами для
            подтверждения. Отменить заявку можно до звонка.
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
            <CardTitle className="text-base">Заявок пока нет</CardTitle>
            <CardDescription>
              Выберите квест на главной и оставьте заявку с удобным временем.
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
                    <CardTitle className="text-base">
                      {b.slot.quest.city?.name
                        ? `${b.slot.quest.city.name} · ${b.slot.quest.title}`
                        : b.slot.quest.title}
                    </CardTitle>
                    <CardDescription>
                      {formatRu(b.slot.startTime, "EEE, d MMMM, HH:mm")} –{" "}
                      {formatRu(b.slot.endTime, "HH:mm")}
                    </CardDescription>
                  </div>
                  <BookingStatusBadge status={b.status} />
                </CardHeader>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Ориентир по цене{" "}
                    <span className="font-medium text-foreground">
                      {formatRub(Number(b.slot.price))}
                    </span>
                    {typeof b.partySize === "number" ? (
                      <>
                        {" "}
                        · людей:{" "}
                        <span className="font-medium text-foreground">
                          {b.partySize}
                        </span>
                      </>
                    ) : null}
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
                  <div className="flex flex-wrap gap-2">
                    {b.status === "REQUEST" || b.status === "PENDING" ? (
                      <CancelBookingButton bookingId={b.id} />
                    ) : null}
                    {b.status === "PENDING" ? (
                      <PayBookingButton bookingId={b.id} />
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
