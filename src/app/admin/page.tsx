import { getActorStats } from "@/app/actions/admin";
import { AssignActorSelect } from "@/components/admin/assign-actor-select";
import { prisma } from "@/lib/prisma";
import { formatRub, formatRu } from "@/lib/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function AdminPage() {
  const [actors, bookedSlots, actorStats] = await Promise.all([
    prisma.actor.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.slot.findMany({
      where: {
        booking: {
          isNot: null,
        },
      },
      select: {
        id: true,
        startTime: true,
        quest: { select: { title: true } },
        booking: { select: { status: true } },
        assignments: {
          take: 1,
          orderBy: { id: "asc" },
          select: { actorId: true },
        },
      },
      orderBy: { startTime: "asc" },
    }),
    getActorStats(),
  ]);

  const statusLabel: Record<string, string> = {
    PENDING: "Ожидает оплаты",
    PAID: "Оплачено",
    CANCELLED: "Отменено",
    BOOKED: "В работе",
  };

  return (
    <main className="space-y-6">
      <div className="space-y-1">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Админка</h1>
          <p className="text-sm text-muted-foreground">
            Управляйте забронированными слотами, назначайте актеров и контролируйте часы работы.
          </p>
        </div>
      </div>

      <Card className="border-border/80 bg-card/50">
        <CardHeader>
          <CardTitle>Расписание</CardTitle>
          <CardDescription>Забронированные слоты и назначение актеров.</CardDescription>
        </CardHeader>
        <CardContent>
          {bookedSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground">Забронированных слотов пока нет.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Квест</TableHead>
                  <TableHead>Начало</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Актер</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookedSlots.map((slot) => (
                  <TableRow key={slot.id}>
                    <TableCell className="font-medium">{slot.quest.title}</TableCell>
                    <TableCell>
                      {formatRu(slot.startTime, "d MMMM yyyy, HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={slot.booking?.status === "PAID" ? "default" : "secondary"}>
                        {statusLabel[slot.booking?.status ?? "BOOKED"] ?? slot.booking?.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <AssignActorSelect
                        key={`${slot.id}-${slot.assignments[0]?.actorId ?? "none"}`}
                        slotId={slot.id}
                        actors={actors}
                        currentActorId={slot.assignments[0]?.actorId ?? null}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card id="work-hours" className="border-border/80 bg-card/50">
        <CardHeader>
          <CardTitle>Рабочие часы</CardTitle>
          <CardDescription>Суммарные часы и выплаты по каждому актеру.</CardDescription>
        </CardHeader>
        <CardContent>
          {actorStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">Актеры не найдены.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Актер</TableHead>
                  <TableHead>Ставка в час</TableHead>
                  <TableHead>Отработано часов</TableHead>
                  <TableHead>Итого к выплате</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actorStats.map((row) => (
                  <TableRow key={row.actorId}>
                    <TableCell className="font-medium">{row.actorName}</TableCell>
                    <TableCell>
                      {formatRub(row.hourlyRate)}
                    </TableCell>
                    <TableCell>{row.hoursWorked.toFixed(2)}</TableCell>
                    <TableCell>
                      {formatRub(row.totalPay)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
