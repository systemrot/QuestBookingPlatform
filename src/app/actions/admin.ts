"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { PAYMENT_HOLD_MINUTES } from "@/lib/booking-policy";
import { invalidateAdminData, invalidateUserBookingData } from "@/lib/cache";
import { getAdminActorStats } from "@/lib/data";
import { invalidateAvailabilityCache } from "@/lib/availability";
import {
  clearPendingHoldMemory,
  rememberPendingHoldMemory,
} from "@/lib/pending-hold";
import { markBookingPaid } from "@/lib/payments/complete-booking";
import { db, dbUrgent } from "@/lib/prisma";
import { syncSlotActors } from "@/lib/slot-actors";

type SessionLike = { user?: { id?: string; role?: string } } | null;

function ensureAdmin(session: SessionLike) {
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }
}

/** Назначить актёров на слот (Prisma Client API — без сырого SQL). */
export async function setSlotActors(slotId: string, actorIds: string[]) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { error: "Недостаточно прав." };
    }

    if (!slotId) {
      return { error: "Не указан слот." };
    }

    const result = await syncSlotActors(slotId, actorIds);
    if (!result.ok) {
      if (result.error === "missing_slot") return { error: "Слот не найден." };
      if (result.error === "missing_actors") {
        return { error: "Один из актёров не найден." };
      }
      if (result.error === "city_mismatch") {
        return {
          error: "Актёр из другого города — нельзя назначить на этот слот.",
        };
      }
      return { error: "Не удалось сохранить актёров. Попробуйте ещё раз." };
    }

    invalidateAdminData();
    return { success: true as const };
  } catch (e) {
    console.error("[setSlotActors]", e);
    return { error: "Не удалось сохранить актёров. Попробуйте ещё раз." };
  }
}

export type ActorStatsRow = {
  actorId: string;
  actorName: string;
  cityName: string;
  hourlyRate: number;
  hoursWorked: number;
  totalPay: number;
};

export async function getActorStats(): Promise<ActorStatsRow[]> {
  const session = await auth();
  ensureAdmin(session);

  const actors = await getAdminActorStats();

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
      cityName: actor.city.name,
      hourlyRate,
      hoursWorked: Number(hoursWorked.toFixed(2)),
      totalPay,
    };
  });
}

export type ActorSalaryRow = {
  actorId: string;
  actorName: string;
  cityName: string;
  gamesCount: number;
  earnedRub: number;
};

export async function getActorSalaryReport(): Promise<ActorSalaryRow[]> {
  const session = await auth();
  ensureAdmin(session);

  const actors = await dbUrgent((prisma) =>
    prisma.actor.findMany({
      select: {
        id: true,
        name: true,
        hourlyRate: true,
        city: { select: { name: true } },
        _count: { select: { assignments: true } },
      },
      orderBy: [{ city: { name: "asc" } }, { name: "asc" }],
    })
  );

  return actors.map((actor) => {
    const gamesCount = actor._count.assignments;
    const earnedRub = Number(actor.hourlyRate) * gamesCount;
    return {
      actorId: actor.id,
      actorName: actor.name,
      cityName: actor.city.name,
      gamesCount,
      earnedRub,
    };
  });
}

export async function adminCancelBooking(bookingId: string) {
  const session = await auth();
  ensureAdmin(session);

  // dbUrgent: не стоять в общей очереди — иначе «Снять» висит десятки секунд.
  const result = await dbUrgent(async (prisma) => {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, status: true, slotId: true, userId: true },
    });
    if (!booking) return { error: "Бронирование не найдено." as const };
    if (booking.status === "CANCELLED") {
      // Идемпотентно: повторный клик / долгий ответ = успех.
      return { success: true as const, userId: booking.userId, already: true as const };
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED", expiresAt: null },
    });
    await prisma.slot.update({
      where: { id: booking.slotId },
      data: { isBooked: false },
    });

    return { success: true as const, userId: booking.userId, already: false as const };
  });

  if ("error" in result) return result;

  clearPendingHoldMemory(result.userId);
  invalidateUserBookingData(result.userId);
  invalidateAdminData();
  invalidateAvailabilityCache();
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/bookings");
  revalidatePath("/profile");
  return { success: true as const, already: result.already };
}

export async function adminExtendHold(bookingId: string) {
  const session = await auth();
  ensureAdmin(session);

  const result = await db(async (prisma) => {
    const now = new Date();
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, status: true, expiresAt: true, userId: true },
    });
    if (!booking) return { error: "Бронирование не найдено." as const };
    if (booking.status !== "PENDING") {
      return { error: "Продлить можно только неоплаченный холд." as const };
    }

    const base =
      booking.expiresAt && booking.expiresAt.getTime() > now.getTime()
        ? booking.expiresAt
        : now;
    const expiresAt = new Date(base.getTime() + PAYMENT_HOLD_MINUTES * 60_000);

    await prisma.booking.update({
      where: { id: bookingId },
      data: { expiresAt },
    });

    return { success: true as const, userId: booking.userId, expiresAt };
  });

  if ("error" in result) return result;

  rememberPendingHoldMemory(result.userId, result.expiresAt);
  invalidateUserBookingData(result.userId);
  invalidateAdminData();
  revalidatePath("/admin");
  revalidatePath("/bookings");
  revalidatePath("/profile");
  return { success: true as const, expiresAt: result.expiresAt.toISOString() };
}

export async function adminMarkBookingPaid(bookingId: string) {
  const session = await auth();
  ensureAdmin(session);

  const marked = await markBookingPaid(bookingId, `admin_${Date.now()}`);
  if (!marked.ok) {
    if (marked.reason === "expired") {
      return { error: "Холд истёк — продлите или создайте бронь заново." };
    }
    if (marked.reason === "conflict") {
      return { error: "Время уже занято другой оплаченной бронью." };
    }
    return { error: "Не удалось отметить оплату." };
  }

  revalidatePath("/admin");
  revalidatePath("/bookings");
  revalidatePath("/profile");
  return { success: true as const };
}
