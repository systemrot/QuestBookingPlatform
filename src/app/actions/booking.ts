"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import {
  listVirtualAvailableSlots,
  invalidateAvailabilityCache,
} from "@/lib/availability";
import {
  minBookableStart,
  moscowDateTime,
  parseVirtualSlotId,
  paymentHoldExpiresAt,
  slotEndTime,
} from "@/lib/booking-policy";
import { invalidateAdminData, invalidateUserBookingData } from "@/lib/cache";
import { markBookingPaid } from "@/lib/payments/complete-booking";
import { dbUrgent } from "@/lib/prisma";
import {
  clearPendingHold,
  clearPendingHoldMemory,
  markPendingHold,
} from "@/lib/pending-hold";
import { Prisma } from "@/generated/prisma";

export type SlotOption = {
  id: string;
  startTime: string;
  endTime: string;
  price: string;
};

function parseMoscowDay(dateStr: string): { from: Date; to: Date } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return {
    from: moscowDateTime(year, month, day, 0, 0),
    to: moscowDateTime(year, month, day, 23, 59),
  };
}

export async function getAvailableSlots(questId: string, dateStr: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "USER") {
    return { error: "Войдите как клиент, чтобы увидеть доступные слоты." as const };
  }

  const bounds = parseMoscowDay(dateStr);
  if (!bounds) {
    return { error: "Некорректная дата." as const };
  }

  const quest = await dbUrgent((prisma) =>
    prisma.quest.findUnique({
      where: { id: questId },
      select: { id: true, price: true },
    })
  );
  if (!quest) {
    return { error: "Квест не найден." as const };
  }

  const slots = await listVirtualAvailableSlots(
    questId,
    bounds.from,
    bounds.to,
    quest.price.toString()
  );

  return { slots };
}

/**
 * Одна round-trip операция к БД (CTE). Interactive $transaction + куча SELECT
 * на Supabase pooler давали 10–30с и Connection terminated.
 */
export async function createBooking(slotId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "USER") {
    return { error: "Для бронирования необходимо войти как клиент." };
  }

  const userId = session.user.id;
  const now = new Date();

  // Правда только в SQL ниже (с очисткой просроченных PENDING).
  clearPendingHoldMemory(userId);

  const virtual = parseVirtualSlotId(slotId);

  let questId: string;
  let startTime: Date;
  let endTime: Date;

  if (virtual) {
    questId = virtual.questId;
    startTime = virtual.start;
    endTime = slotEndTime(startTime);
  } else {
    const existing = await dbUrgent((prisma) =>
      prisma.slot.findUnique({
        where: { id: slotId },
        select: { questId: true, startTime: true, endTime: true },
      })
    );
    if (!existing) {
      return { error: "Этот слот уже недоступен." };
    }
    questId = existing.questId;
    startTime = existing.startTime;
    endTime = existing.endTime;
  }

  if (startTime.getTime() < minBookableStart(now).getTime()) {
    return {
      error: "Этот слот слишком близко по времени — запись минимум за 3 часа.",
    };
  }

  const bookingId = randomUUID();
  const slotInsertId = randomUUID();
  const expiresAt = paymentHoldExpiresAt(now);
  // Явный UTC ISO — иначе pg/adapter пишет «локальные» часы как timestamptz и холд живёт часами.
  const expiresAtIso = expiresAt.toISOString();

  try {
    // Один round-trip: погасить просроченные/битые холды + создать бронь.
    const rows = await dbUrgent((prisma) =>
      prisma.$queryRaw<{ id: string | null; code: string; replacedCount: number }[]>`
        WITH cleared AS (
          -- Политика: у клиента один активный PENDING-холд.
          -- Новая бронь снимает предыдущий холд (оплаченные PAID не трогаем).
          UPDATE "Booking"
          SET status = 'CANCELLED'::"BookingStatus",
              "expiresAt" = NULL,
              "updatedAt" = NOW()
          WHERE "userId" = ${userId}
            AND status = 'PENDING'::"BookingStatus"
          RETURNING id
        ),
        blocked AS (
          SELECT b.id
          FROM "Booking" b
          INNER JOIN "Slot" s ON s.id = b."slotId"
          WHERE b.status = 'PAID'::"BookingStatus"
            AND s."startTime" < ${endTime}
            AND s."endTime" > ${startTime}
          LIMIT 1
        ),
        slot AS (
          INSERT INTO "Slot" (
            id, "startTime", "endTime", "isBooked", "questId", price, "createdAt", "updatedAt"
          )
          SELECT
            ${slotInsertId},
            ${startTime},
            ${endTime},
            false,
            ${questId},
            q.price,
            NOW(),
            NOW()
          FROM "Quest" q
          WHERE q.id = ${questId}
          ON CONFLICT ("questId", "startTime") DO UPDATE
            SET "updatedAt" = NOW()
          RETURNING id
        ),
        ins AS (
          INSERT INTO "Booking" (
            id, "userId", "slotId", status, "expiresAt", "createdAt", "updatedAt"
          )
          SELECT
            ${bookingId},
            ${userId},
            slot.id,
            'PENDING'::"BookingStatus",
            ${expiresAtIso}::timestamptz,
            NOW(),
            NOW()
          FROM slot
          WHERE NOT EXISTS (SELECT 1 FROM blocked)
          RETURNING id
        )
        SELECT
          (SELECT id FROM ins) AS id,
          CASE
            WHEN EXISTS (SELECT 1 FROM ins) THEN 'OK'
            WHEN NOT EXISTS (SELECT 1 FROM slot) THEN 'NO_QUEST'
            ELSE 'SLOT_TAKEN'
          END AS code,
          (SELECT COUNT(*)::int FROM cleared) AS "replacedCount"
      `
    );

    const row = rows[0];
    if (!row || row.code !== "OK" || !row.id) {
      if (row?.code === "NO_QUEST") {
        return { error: "Квест не найден." };
      }
      return { error: "Этот слот уже недоступен." };
    }

    await markPendingHold(userId, expiresAt);
    invalidateAvailabilityCache();
    revalidatePath("/");
    revalidatePath("/bookings");
    revalidatePath("/admin");
    invalidateUserBookingData(userId);
    invalidateAdminData();
    return {
      success: true as const,
      bookingId: row.id,
      expiresAt: expiresAt.toISOString(),
      replacedPreviousHold: (row.replacedCount ?? 0) > 0,
    };
  } catch (e) {
    console.error("[createBooking]", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      return { error: "Не удалось оформить бронирование. Попробуйте еще раз." };
    }
    return { error: "Не удалось оформить бронирование. Попробуйте еще раз." };
  }
}

export async function completeMockPayment(bookingId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "USER") {
    return { error: "Для оплаты нужно войти как пользователь." };
  }

  const now = new Date();
  const gate = await dbUrgent(async (prisma) => {
    await prisma.booking.updateMany({
      where: {
        userId: session.user!.id,
        status: "PENDING",
        expiresAt: { lte: now },
      },
      data: { status: "CANCELLED", expiresAt: null },
    });

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId: session.user!.id },
      select: { id: true, status: true, expiresAt: true },
    });
    if (!booking) return { error: "Бронирование не найдено." as const };
    if (booking.status === "CANCELLED") {
      return { error: "Бронирование отменено или холд истёк." as const };
    }
    if (
      booking.status === "PENDING" &&
      booking.expiresAt &&
      booking.expiresAt.getTime() <= now.getTime()
    ) {
      return { error: "Время на оплату истекло. Выберите слот заново." as const };
    }
    return { ok: true as const };
  });

  if ("error" in gate) return gate;

  const marked = await markBookingPaid(bookingId, `mock_${Date.now()}`);
  if (!marked.ok) {
    return { error: "Не удалось подтвердить оплату." };
  }

  await clearPendingHold(session.user.id);
  invalidateAvailabilityCache();
  revalidatePath("/profile");
  revalidatePath("/bookings");
  revalidatePath("/admin");
  return { success: true as const };
}
