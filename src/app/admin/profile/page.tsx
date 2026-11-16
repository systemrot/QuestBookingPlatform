import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRu } from "@/lib/locale";
import { dbUrgent } from "@/lib/prisma";
import { isStaff } from "@/lib/roles";
import { displayRuPhoneFromStored } from "@/lib/ru-phone";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Администратор",
  OWNER: "Владелец",
};

export default async function AdminProfilePage() {
  const session = await auth();
  if (!session?.user?.id || !isStaff(session.user.role)) {
    redirect("/admin");
  }

  const user = await dbUrgent((prisma) =>
    prisma.user.findUnique({
      where: { id: session.user!.id },
      select: {
        name: true,
        email: true,
        phone: true,
        age: true,
        role: true,
        createdAt: true,
      },
    })
  );

  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Профиль</h1>
        <p className="text-sm text-muted-foreground">
          Имя и контакты для команды и переписок. Email менять здесь нельзя.
        </p>
      </div>

      <Card className="border-border/80 bg-card/50">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="font-heading text-xl">Данные аккаунта</CardTitle>
            <Badge variant="secondary">
              {ROLE_LABEL[user.role] ?? user.role}
            </Badge>
          </div>
          <CardDescription>
            Это имя видно коллегам в команде, идеях и сообщениях.
          </CardDescription>
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
    </main>
  );
}
