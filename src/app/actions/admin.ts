"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type SessionLike = { user?: { id?: string; role?: string } } | null;

function ensureAdmin(session: SessionLike) {
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }
}

export async function assignActorToSlot(actorId: string, slotId: string) {
  const session = await auth();
  ensureAdmin(session);

  if (!actorId || !slotId) {
    return { error: "Нужно выбрать актера и слот." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.assignment.deleteMany({ where: { slotId } });
    await tx.assignment.create({
      data: { actorId, slotId },
    });
  });

  revalidatePath("/admin");
  return { success: true };
}

export type ActorStatsRow = {
  actorId: string;
  actorName: string;
  hourlyRate: number;
  hoursWorked: number;
  totalPay: number;
};

export async function getActorStats(): Promise<ActorStatsRow[]> {
  const session = await auth();
  ensureAdmin(session);

  const actors = await prisma.actor.findMany({
    include: {
      assignments: {
        include: {
          slot: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return actors.map((actor) => {
    const hoursWorked = actor.assignments.reduce((acc, assignment) => {
      const ms = assignment.slot.endTime.getTime() - assignment.slot.startTime.getTime();
      return acc + ms / (1000 * 60 * 60);
    }, 0);

    const hourlyRate = Number(actor.hourlyRate);
    const totalPay = Number((hoursWorked * hourlyRate).toFixed(2));

    return {
      actorId: actor.id,
      actorName: actor.name,
      hourlyRate,
      hoursWorked: Number(hoursWorked.toFixed(2)),
      totalPay,
    };
  });
}

export type ActorSalaryRow = {
  actorId: string;
  actorName: string;
  gamesCount: number;
  earnedRub: number;
};

export async function getActorSalaryReport(): Promise<ActorSalaryRow[]> {
  const session = await auth();
  ensureAdmin(session);

  const actors = await prisma.actor.findMany({
    include: {
      assignments: true,
    },
    orderBy: { name: "asc" },
  });

  return actors.map((actor) => {
    const gamesCount = actor.assignments.length;
    const earnedRub = Number(actor.hourlyRate) * gamesCount;
    return {
      actorId: actor.id,
      actorName: actor.name,
      gamesCount,
      earnedRub,
    };
  });
}

