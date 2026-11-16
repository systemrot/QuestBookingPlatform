"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { dbUrgent } from "@/lib/prisma";
import { isOwner, isStaff } from "@/lib/roles";

const KINDS = ["WISH", "REVIEW", "BUG", "OTHER"] as const;
export type FeedbackKindValue = (typeof KINDS)[number];
export type FeedbackVoteValue = "LIKE" | "DISLIKE";

function isFeedbackKind(value: unknown): value is FeedbackKindValue {
  return (
    value === "WISH" ||
    value === "REVIEW" ||
    value === "BUG" ||
    value === "OTHER"
  );
}

function isVoteValue(value: unknown): value is FeedbackVoteValue {
  return value === "LIKE" || value === "DISLIKE";
}

const MESSAGE_MAX = 2000;
const COMMENT_MAX = 500;

function revalidateFeedback() {
  revalidatePath("/admin/feedback");
}

async function ensureStaff() {
  const session = await auth();
  if (!session?.user?.id || !isStaff(session.user.role)) return null;
  return session;
}

export async function submitFeedback(input: {
  kind: FeedbackKindValue;
  message: string;
}) {
  const session = await ensureStaff();
  if (!session?.user?.id) return { error: "Недостаточно прав." as const };

  if (!isFeedbackKind(input.kind)) {
    return { error: "Выберите тип сообщения." as const };
  }

  const message = input.message.trim();
  if (message.length < 3) {
    return { error: "Напишите хотя бы пару слов." as const };
  }
  if (message.length > MESSAGE_MAX) {
    return { error: `Не длиннее ${MESSAGE_MAX} символов.` as const };
  }

  try {
    await dbUrgent((prisma) =>
      prisma.feedback.create({
        data: {
          userId: session.user!.id!,
          kind: input.kind,
          message,
        },
      })
    );
    revalidateFeedback();
    return { success: true as const };
  } catch (e) {
    console.error("[submitFeedback]", e);
    return { error: "Не удалось отправить." as const };
  }
}

export async function deleteFeedback(id: string) {
  const session = await ensureStaff();
  if (!session?.user?.id || !isOwner(session.user.role)) {
    return { error: "Недостаточно прав." as const };
  }
  if (!id.trim()) return { error: "Не указано сообщение." as const };

  try {
    await dbUrgent((prisma) =>
      prisma.feedback.delete({ where: { id: id.trim() } })
    );
    revalidateFeedback();
    return { success: true as const };
  } catch (e) {
    console.error("[deleteFeedback]", e);
    return { error: "Не удалось удалить." as const };
  }
}

/** Toggle vote: same value removes, other value switches. */
export async function setFeedbackVote(input: {
  feedbackId: string;
  value: FeedbackVoteValue;
}) {
  const session = await ensureStaff();
  if (!session?.user?.id) return { error: "Недостаточно прав." as const };

  const feedbackId = input.feedbackId.trim();
  if (!feedbackId || !isVoteValue(input.value)) {
    return { error: "Некорректный голос." as const };
  }

  try {
    const exists = await dbUrgent((prisma) =>
      prisma.feedback.findUnique({
        where: { id: feedbackId },
        select: { id: true },
      })
    );
    if (!exists) return { error: "Идея не найдена." as const };

    const current = await dbUrgent((prisma) =>
      prisma.feedbackVote.findUnique({
        where: {
          feedbackId_userId: {
            feedbackId,
            userId: session.user!.id!,
          },
        },
        select: { id: true, value: true },
      })
    );

    if (current?.value === input.value) {
      await dbUrgent((prisma) =>
        prisma.feedbackVote.delete({ where: { id: current.id } })
      );
    } else if (current) {
      await dbUrgent((prisma) =>
        prisma.feedbackVote.update({
          where: { id: current.id },
          data: { value: input.value },
        })
      );
    } else {
      await dbUrgent((prisma) =>
        prisma.feedbackVote.create({
          data: {
            feedbackId,
            userId: session.user!.id!,
            value: input.value,
          },
        })
      );
    }

    revalidateFeedback();
    return { success: true as const };
  } catch (e) {
    console.error("[setFeedbackVote]", e);
    return { error: "Не удалось сохранить голос." as const };
  }
}

export async function addFeedbackComment(input: {
  feedbackId: string;
  message: string;
}) {
  const session = await ensureStaff();
  if (!session?.user?.id) return { error: "Недостаточно прав." as const };

  const feedbackId = input.feedbackId.trim();
  const message = input.message.trim();
  if (!feedbackId) return { error: "Идея не найдена." as const };
  if (message.length < 1) return { error: "Введите комментарий." as const };
  if (message.length > COMMENT_MAX) {
    return { error: `Комментарий не длиннее ${COMMENT_MAX} символов.` as const };
  }

  try {
    const exists = await dbUrgent((prisma) =>
      prisma.feedback.findUnique({
        where: { id: feedbackId },
        select: { id: true },
      })
    );
    if (!exists) return { error: "Идея не найдена." as const };

    await dbUrgent((prisma) =>
      prisma.feedbackComment.create({
        data: {
          feedbackId,
          userId: session.user!.id!,
          message,
        },
      })
    );
    revalidateFeedback();
    return { success: true as const };
  } catch (e) {
    console.error("[addFeedbackComment]", e);
    return { error: "Не удалось отправить комментарий." as const };
  }
}

export async function deleteFeedbackComment(id: string) {
  const session = await ensureStaff();
  if (!session?.user?.id) return { error: "Недостаточно прав." as const };
  const commentId = id.trim();
  if (!commentId) return { error: "Не указан комментарий." as const };

  try {
    const comment = await dbUrgent((prisma) =>
      prisma.feedbackComment.findUnique({
        where: { id: commentId },
        select: { id: true, userId: true },
      })
    );
    if (!comment) return { error: "Комментарий не найден." as const };

    const canDelete =
      comment.userId === session.user.id || isOwner(session.user.role);
    if (!canDelete) return { error: "Недостаточно прав." as const };

    await dbUrgent((prisma) =>
      prisma.feedbackComment.delete({ where: { id: comment.id } })
    );
    revalidateFeedback();
    return { success: true as const };
  } catch (e) {
    console.error("[deleteFeedbackComment]", e);
    return { error: "Не удалось удалить комментарий." as const };
  }
}
