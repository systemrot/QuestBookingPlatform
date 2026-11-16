"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import {
  listVirtualAvailableSlots,
  invalidateAvailabilityCache,
} from "@/lib/availability";
import {
  MAX_PARTY_SIZE,
  REQUEST_RATE_LIMIT_COUNT,
  REQUEST_RATE_LIMIT_WINDOW_MS,
  minBookableStart,
  moscowDateTime,
  parseVirtualSlotId,
  slotEndTime,
} from "@/lib/booking-policy";
import { invalidateAdminData, invalidateUserBookingData } from "@/lib/cache";
import { notifyManagerBookingRequest } from "@/lib/mail/notify-manager-request";
import { toRuPhoneE164, extractRuPhoneDigits } from "@/lib/ru-phone";
import { dbUrgent } from "@/lib/prisma";
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

/** Слоты доступны без авторизации (время = пожелание, REQUEST не блокирует). */
export async function getAvailableSlots(questId: string, dateStr: string) {
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

export type CreateBookingRequestInput = {
  slotId: string;
  name: string;
  phone: string;
  partySize: number;
  email?: string;
};

/**
 * Заявка на созвон: слот не блокируется, холда нет.
 * Гости и залогиненные клиенты.
 */
export async function createBookingRequest(input: CreateBookingRequestInput) {
  const session = await auth();
  if (
    session?.user?.role === "ADMIN" ||
    session?.user?.role === "OWNER"
  ) {
    return { error: "Заявки оставляют клиенты. Войдите как пользователь или выйдите." };
  }

  const name = input.name?.trim() ?? "";
  if (name.length < 2) {
    return { error: "Укажите имя (минимум 2 символа)." };
  }
  if (name.length > 80) {
    return { error: "Слишком длинное имя." };
  }

  const phone = toRuPhoneE164(extractRuPhoneDigits(input.phone ?? ""));
  if (!phone) {
    return { error: "Укажите полный мобильный номер: +7 (9XX) XXX-XX-XX" };
  }

  const partySize = Number(input.partySize);
  if (
    !Number.isInteger(partySize) ||
    partySize < 1 ||
    partySize > MAX_PARTY_SIZE
  ) {
    return { error: `Число людей — от 1 до ${MAX_PARTY_SIZE}.` };
  }

  const emailRaw = input.email?.trim() || session?.user?.email?.trim() || "";
  const email =
    emailRaw && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw) ? emailRaw : null;
  if (emailRaw && !email) {
    return { error: "Некорректный email." };
  }

  const userId =
    session?.user?.id && session.user.role === "USER"
      ? session.user.id
      : null;

  const now = new Date();
  const virtual = parseVirtualSlotId(input.slotId);

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
        where: { id: input.slotId },
        select: { questId: true, startTime: true, endTime: true },
      })
    );
    if (!existing) {
      return { error: "Выбранное время недоступно. Выберите слот заново." };
    }
    questId = existing.questId;
    startTime = existing.startTime;
    endTime = existing.endTime;
  }

  if (startTime.getTime() < minBookableStart(now).getTime()) {
    return {
      error: "Это время слишком близко — запись минимум за 3 часа.",
    };
  }

  const windowStart = new Date(now.getTime() - REQUEST_RATE_LIMIT_WINDOW_MS);
  const recentCount = await dbUrgent((prisma) =>
    prisma.booking.count({
      where: {
        contactPhone: phone,
        createdAt: { gte: windowStart },
        status: { in: ["REQUEST", "CANCELLED"] },
      },
    })
  );
  if (recentCount >= REQUEST_RATE_LIMIT_COUNT) {
    return {
      error:
        "Слишком много заявок с этого номера. Подождите немного или дождитесь звонка менеджера.",
    };
  }

  const bookingId = randomUUID();
  const slotInsertId = randomUUID();

  try {
    const rows = await dbUrgent((prisma) =>
      prisma.$queryRaw<{ id: string | null; code: string }[]>`
        WITH slot AS (
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
            id, "userId", "slotId", status, "expiresAt",
            "contactName", "contactPhone", "partySize", "contactEmail",
            "createdAt", "updatedAt"
          )
          SELECT
            ${bookingId},
            ${userId},
            slot.id,
            'REQUEST'::"BookingStatus",
            NULL,
            ${name},
            ${phone},
            ${partySize},
            ${email},
            NOW(),
            NOW()
          FROM slot
          RETURNING id
        )
        SELECT
          (SELECT id FROM ins) AS id,
          CASE
            WHEN EXISTS (SELECT 1 FROM ins) THEN 'OK'
            WHEN NOT EXISTS (SELECT 1 FROM slot) THEN 'NO_QUEST'
            ELSE 'FAIL'
          END AS code
      `
    );

    const row = rows[0];
    if (!row || row.code !== "OK" || !row.id) {
      if (row?.code === "NO_QUEST") {
        return { error: "Квест не найден." };
      }
      return { error: "Не удалось отправить заявку. Попробуйте ещё раз." };
    }

    void notifyManagerBookingRequest(row.id, "created");

    // REQUEST не занимает сетку — кэш занятости можно не трогать, но админку обновим.
    revalidatePath("/");
    revalidatePath("/bookings");
    revalidatePath("/admin");
    revalidatePath("/profile");
    if (userId) invalidateUserBookingData(userId);
    invalidateAdminData();

    return {
      success: true as const,
      bookingId: row.id,
      preferredStart: startTime.toISOString(),
    };
  } catch (e) {
    console.error("[createBookingRequest]", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      return { error: "Не удалось отправить заявку. Попробуйте ещё раз." };
    }
    return { error: "Не удалось отправить заявку. Попробуйте ещё раз." };
  }
}

/** Отмена своей заявки (только авторизованный клиент) + письмо менеджеру. */
export async function cancelBookingRequest(bookingId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "USER") {
    return { error: "Войдите, чтобы отменить заявку." };
  }

  const userId = session.user.id;

  const result = await dbUrgent(async (prisma) => {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId },
      select: { id: true, status: true },
    });
    if (!booking) return { error: "Заявка не найдена." as const };
    if (booking.status === "CANCELLED") {
      return { success: true as const, already: true as const };
    }
    if (booking.status !== "REQUEST" && booking.status !== "PENDING") {
      return { error: "Эту бронь нельзя отменить здесь." as const };
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED", expiresAt: null },
    });

    return { success: true as const, already: false as const };
  });

  if ("error" in result) return result;

  if (!result.already) {
    void notifyManagerBookingRequest(bookingId, "cancelled");
  }

  invalidateAvailabilityCache();
  invalidateUserBookingData(userId);
  invalidateAdminData();
  revalidatePath("/");
  revalidatePath("/bookings");
  revalidatePath("/profile");
  revalidatePath("/admin");

  return { success: true as const, already: result.already };
}
