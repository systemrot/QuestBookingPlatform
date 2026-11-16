import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { TeamManager } from "@/components/admin/team-manager";
import { dbUrgent } from "@/lib/prisma";
import { isOwner } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  const session = await auth();
  if (!session?.user?.id || !isOwner(session.user.role)) {
    redirect("/admin");
  }

  const members = await dbUrgent((prisma) =>
    prisma.user.findMany({
      where: { role: { in: ["OWNER", "ADMIN"] } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })
  );

  const roleOrder = { OWNER: 0, ADMIN: 1 } as const;
  const sorted = [...members]
    .filter(
      (m): m is typeof m & { role: "OWNER" | "ADMIN" } =>
        m.role === "OWNER" || m.role === "ADMIN"
    )
    .sort((a, b) => {
      const byRole = roleOrder[a.role] - roleOrder[b.role];
      if (byRole !== 0) return byRole;
      return a.name.localeCompare(b.name, "ru");
    });

  return (
    <main className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Команда</h1>
        <p className="text-sm text-muted-foreground">
          Здесь только владельцы и админы. Нового админа добавляете по email —
          клиенты в списке не показываются.
        </p>
      </div>
      <TeamManager currentUserId={session.user.id} members={sorted} />
    </main>
  );
}
