import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog";
import { PayBookingButton } from "@/components/profile/pay-booking-button";
import { prisma } from "@/lib/prisma";
import { formatRu } from "@/lib/locale";
import { displayRuPhoneFromStored } from "@/lib/ru-phone";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, bookings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        phone: true,
        age: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.booking.findMany({
      where: { userId: session.user.id },
      include: {
        slot: {
          include: {
            quest: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!user) redirect("/login");

  const roleLabel: Record<string, string> = {
    USER: "Пользователь",
    ADMIN: "Администратор",
  };

  const statusLabel: Record<string, string> = {
    PENDING: "Ожидает оплаты",
    PAID: "Оплачено",
    CANCELLED: "Отменено",
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <Card className="border-border/80 bg-card/50">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="font-heading text-xl">Профиль</CardTitle>
            <Badge variant="secondary">{roleLabel[user.role] ?? user.role}</Badge>
          </div>
          <CardDescription>Данные вашего аккаунта</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-border/60 py-2">
            <span className="text-muted-foreground">Имя</span>
            <span className="text-right font-medium">{user.name}</span>
          </div>
          <div className="flex justify-between gap-4 border-b border-border/60 py-2">
            <span className="text-muted-foreground">Эл. почта</span>
            <span className="text-right font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between gap-4 border-b border-border/60 py-2">
            <span className="text-muted-foreground">Телефон</span>
            <span className="text-right font-medium">
              {user.phone ? displayRuPhoneFromStored(user.phone) : "—"}
            </span>
          </div>
          <div className="flex justify-between gap-4 border-b border-border/60 py-2">
            <span className="text-muted-foreground">Возраст</span>
            <span className="text-right font-medium">{user.age ?? "—"}</span>
          </div>
          <div className="flex justify-between gap-4 py-2">
            <span className="text-muted-foreground">С нами с</span>
            <span className="text-right font-medium">
              {formatRu(user.createdAt, "d MMMM yyyy")}
            </span>
          </div>
          <div className="pt-2">
            <EditProfileDialog name={user.name} age={user.age} phone={user.phone} />
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/80 bg-card/50">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Мои бронирования</CardTitle>
          <CardDescription>Текущие и прошлые бронирования со статусом.</CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">У вас пока нет бронирований.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Квест</TableHead>
                  <TableHead>Слот</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Оплата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.slot.quest.title}</TableCell>
                    <TableCell>
                      {formatRu(booking.slot.startTime, "d MMMM yyyy, HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={booking.status === "PAID" ? "default" : "secondary"}>
                        {statusLabel[booking.status] ?? booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {booking.status === "PENDING" ? (
                        <PayBookingButton bookingId={booking.id} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </main>
  );
}
