import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog";
import {
  ProfileBookingsPanel,
  type ProfileBookingRow,
} from "@/components/profile/profile-bookings-panel";
import { resolveBookingStatus } from "@/lib/booking-policy";
import { getUserProfilePage } from "@/lib/data";
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

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const { user, bookings: rawBookings } = await getUserProfilePage(userId);

  if (!user) redirect("/login");

  const now = new Date();
  const bookings: ProfileBookingRow[] = rawBookings.map((b) => ({
    id: b.id,
    status: resolveBookingStatus(b.status, b.expiresAt, now),
    expiresAt: b.expiresAt ? b.expiresAt.toISOString() : null,
    slot: {
      startTime: b.slot.startTime.toISOString(),
      quest: {
        title: b.slot.quest.title,
        city: b.slot.quest.city
          ? { name: b.slot.quest.city.name, slug: b.slot.quest.city.slug }
          : null,
      },
    },
  }));

  const roleLabel: Record<string, string> = {
    USER: "Пользователь",
    ADMIN: "Администратор",
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
      <div className="grid gap-6 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)]">
        <Card className="border-border/80 bg-card/50">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="font-heading text-xl">Профиль</CardTitle>
              <Badge variant="secondary">
                {roleLabel[user.role] ?? user.role}
              </Badge>
            </div>
            <CardDescription>Данные вашего аккаунта</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-border/60 py-2">
              <span className="shrink-0 text-muted-foreground">Имя</span>
              <span className="text-right font-medium">{user.name}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border/60 py-2">
              <span className="shrink-0 text-muted-foreground">Эл. почта</span>
              <span className="max-w-[65%] truncate text-right font-medium">
                {user.email}
              </span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border/60 py-2">
              <span className="shrink-0 text-muted-foreground">Телефон</span>
              <span className="text-right font-medium">
                {user.phone ? displayRuPhoneFromStored(user.phone) : "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border/60 py-2">
              <span className="shrink-0 text-muted-foreground">Возраст</span>
              <span className="text-right font-medium">{user.age ?? "—"}</span>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <span className="shrink-0 text-muted-foreground">С нами с</span>
              <span className="text-right font-medium">
                {formatRu(user.createdAt, "d MMMM yyyy")}
              </span>
            </div>
            <div className="pt-2">
              <EditProfileDialog
                name={user.name}
                age={user.age}
                phone={user.phone}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 border-border/80 bg-card/50">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Мои бронирования</CardTitle>
            <CardDescription>
              По умолчанию — активные. Отменённые можно удалить списком.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            <ProfileBookingsPanel bookings={bookings} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
