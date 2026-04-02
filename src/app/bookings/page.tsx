import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
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

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "secondary",
  PAID: "default",
  CANCELLED: "outline",
};
const statusLabel: Record<string, string> = {
  PENDING: "Ожидает оплаты",
  PAID: "Оплачено",
  CANCELLED: "Отменено",
};

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      slot: {
        include: { quest: true },
      },
    },
  });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Мои бронирования</h1>
          <p className="text-sm text-muted-foreground">
            Слоты со статусом &quot;Ожидает оплаты&quot; остаются зарезервированными до подтверждения оплаты.
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
                  <Badge variant={statusVariant[b.status] ?? "secondary"}>
                    {statusLabel[b.status] ?? b.status}
                  </Badge>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Стоимость слота{" "}
                  <span className="font-medium text-foreground">
                    {formatRub(Number(b.slot.price))}
                  </span>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
