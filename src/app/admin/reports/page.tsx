import { getActorSalaryReport } from "@/app/actions/admin";
import { formatRub } from "@/lib/locale";
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

export default async function AdminReportsPage() {
  const rows = await getActorSalaryReport();

  return (
    <main className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Отчеты</h1>
        <p className="text-sm text-muted-foreground">Выплаты актерам по количеству назначенных игр.</p>
      </div>

      <Card className="border-border/80 bg-card/50">
        <CardHeader>
          <CardTitle>Зарплаты актеров</CardTitle>
          <CardDescription>Формула: количество назначенных слотов x ставка актера.</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока нет данных для отчета.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Город</TableHead>
                  <TableHead>Актер</TableHead>
                  <TableHead>Всего игр</TableHead>
                  <TableHead>Заработано (₽)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.actorId}>
                    <TableCell className="text-muted-foreground">
                      {row.cityName}
                    </TableCell>
                    <TableCell className="font-medium">{row.actorName}</TableCell>
                    <TableCell>{row.gamesCount}</TableCell>
                    <TableCell>{formatRub(row.earnedRub)}</TableCell>
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

