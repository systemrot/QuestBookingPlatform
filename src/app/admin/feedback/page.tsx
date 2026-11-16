import { redirect } from "next/navigation";
import { Lightbulb } from "lucide-react";

import { auth } from "@/auth";
import { FeedbackPanel } from "@/components/admin/feedback-panel";
import type { FeedbackVoteValue } from "@/app/actions/feedback";
import { dbUrgent } from "@/lib/prisma";
import { isOwner, isStaff } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  const session = await auth();
  if (!session?.user?.id || !isStaff(session.user.role)) {
    redirect("/");
  }

  const rows = await dbUrgent((prisma) =>
    prisma.feedback.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        kind: true,
        message: true,
        createdAt: true,
        user: {
          select: { name: true, email: true, role: true },
        },
        votes: {
          select: { value: true, userId: true },
        },
        comments: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            message: true,
            createdAt: true,
            userId: true,
            user: { select: { name: true } },
          },
        },
      },
    })
  );

  const items = rows
    .map((item) => {
      const likes = item.votes.filter((v) => v.value === "LIKE").length;
      const dislikes = item.votes.filter((v) => v.value === "DISLIKE").length;
      const my = item.votes.find((v) => v.userId === session.user!.id);
      const myVote = (my?.value ?? null) as FeedbackVoteValue | null;
      return {
        id: item.id,
        kind: item.kind,
        message: item.message,
        createdAt: item.createdAt.toISOString(),
        authorName: item.user.name,
        authorEmail: item.user.email,
        authorRole: item.user.role,
        likes,
        dislikes,
        score: likes - dislikes,
        myVote,
        comments: item.comments.map((c) => ({
          id: c.id,
          message: c.message,
          createdAt: c.createdAt.toISOString(),
          authorId: c.userId,
          authorName: c.user.name,
        })),
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.createdAt.localeCompare(a.createdAt);
    });

  return (
    <main className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <Lightbulb className="size-5 shrink-0" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide">
            Обратная связь
          </span>
        </div>
        <h1 className="font-heading text-2xl font-semibold">Отзывы и идеи</h1>
        <p className="text-sm text-muted-foreground">
          Общая доска для команды: публикуйте идеи, ставьте лайки и
          комментируйте — так понятнее, что важнее всего.
        </p>
      </div>

      <FeedbackPanel
        currentUserId={session.user.id}
        canModerate={isOwner(session.user.role)}
        items={items}
      />
    </main>
  );
}
