import { MessagesAdminPanel } from "@/components/admin/messages-admin-panel";

type PageProps = {
  params: Promise<{ userId: string }>;
};

export default async function AdminUserMessagesPage({ params }: PageProps) {
  const { userId } = await params;

  return (
    <main className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Сообщения поддержки</h1>
        <p className="text-sm text-muted-foreground">Диалог с пользователем.</p>
      </div>
      <MessagesAdminPanel initialUserId={userId} />
    </main>
  );
}

