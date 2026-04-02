import { MessagesAdminPanel } from "@/components/admin/messages-admin-panel";

type PageProps = {
  searchParams: Promise<{ userId?: string }>;
};

export default async function AdminMessagesPage({ searchParams }: PageProps) {
  const { userId } = await searchParams;

  return (
    <main className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Сообщения поддержки</h1>
        <p className="text-sm text-muted-foreground">Все чаты с пользователями в одном месте.</p>
      </div>
      <MessagesAdminPanel initialUserId={userId ?? null} />
    </main>
  );
}

