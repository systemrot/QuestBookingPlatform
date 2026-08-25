import type { Prisma, PrismaClient } from "@/generated/prisma";
import {
  isBookingBlocking,
  listScheduleStarts,
  rangesOverlap,
  SESSION_BLOCK_MINUTES,
  slotEndTime,
} from "@/lib/booking-policy";
import { invalidateAdminData } from "@/lib/cache";

type DbClient = PrismaClient | Prisma.TransactionClient;

const activeBookingSelect = {
  id: true,
  status: true,
  expiresAt: true,
  slotId: true,
  userId: true,
  slot: {
    select: {
      id: true,
      startTime: true,
      endTime: true,
      questId: true,
    },
  },
} satisfies Prisma.BookingSelect;

export type ActiveBookingRow = Prisma.BookingGetPayload<{
  select: typeof activeBookingSelect;
}>;

/** Быстрый сброс просроченных холдов (один UPDATE). */
export async function expireStaleHolds(
  client: DbClient,
  now: Date = new Date()
): Promise<number> {
  const legacyCutoff = new Date(now.getTime() - 20 * 60_000);
  const expired = await client.booking.updateMany({
    where: {
      status: "PENDING",
      OR: [
        { expiresAt: { lte: now } },
        { AND: [{ expiresAt: null }, { createdAt: { lte: legacyCutoff } }] },
      ],
    },
    data: { status: "CANCELLED", expiresAt: null },
  });
  return expired.count;
}

/** Создаёт недостающие слоты сетки для квеста на горизонте (админ/сид, не hot-path). */
export async function ensureQuestSlotGrid(
  client: DbClient,
  questId: string,
  price: Prisma.Decimal | number | string,
  from: Date = new Date()
): Promise<void> {
  const starts = listScheduleStarts(from);
  if (starts.length === 0) return;

  const existing = await client.slot.findMany({
    where: {
      questId,
      startTime: { in: starts },
    },
    select: { startTime: true },
  });
  const have = new Set(existing.map((s) => s.startTime.getTime()));

  const missing = starts.filter((s) => !have.has(s.getTime()));
  if (missing.length === 0) return;

  const chunkSize = 15;
  for (let i = 0; i < missing.length; i += chunkSize) {
    const chunk = missing.slice(i, i + chunkSize);
    await client.slot.createMany({
      data: chunk.map((start) => ({
        questId,
        startTime: start,
        endTime: slotEndTime(start),
        price,
        isBooked: false,
      })),
      skipDuplicates: true,
    });
  }
}

export async function ensureAllQuestSlotGrids(
  client: DbClient,
  from: Date = new Date()
): Promise<void> {
  const quests = await client.quest.findMany({
    select: { id: true, price: true },
  });
  for (const q of quests) {
    await ensureQuestSlotGrid(client, q.id, q.price, from);
  }
}

export async function listBlockingBookings(
  client: DbClient,
  now: Date = new Date(),
  range?: { from: Date; to: Date }
): Promise<ActiveBookingRow[]> {
  // На чтении не делаем UPDATE: просроченный PENDING просто не попадает в выборку
  // (expiresAt > now). Сжигание — при createBooking / оплате / админке.
  const rows = await client.booking.findMany({
    where: {
      OR: [
        { status: "PAID" },
        { status: "PENDING", expiresAt: { gt: now } },
      ],
      ...(range
        ? {
            slot: {
              startTime: { lt: range.to },
              endTime: { gt: range.from },
            },
          }
        : {}),
    },
    select: activeBookingSelect,
  });

  return rows.filter((b) => isBookingBlocking(b.status, b.expiresAt, now));
}

export function isTimeRangeBlocked(
  start: Date,
  end: Date,
  blocking: ActiveBookingRow[]
): boolean {
  return blocking.some((b) =>
    rangesOverlap(start, end, b.slot.startTime, b.slot.endTime)
  );
}

/**
 * Hot-path: слоты на один день.
 * Обычно 2 запроса (слоты дня + пересекающиеся брони), без пересборки всей сетки на 14 дней.
 */
export async function findAvailableSlotsForQuestDay(
  client: DbClient,
  questId: string,
  dayFrom: Date,
  dayTo: Date,
  now: Date = new Date()
) {
  const dayStarts = listScheduleStarts(now).filter(
    (s) => s.getTime() >= dayFrom.getTime() && s.getTime() <= dayTo.getTime()
  );
  if (dayStarts.length === 0) return [];

  let slots = await client.slot.findMany({
    where: {
      questId,
      startTime: { in: dayStarts },
    },
    orderBy: { startTime: "asc" },
  });

  // Досоздаём только этот день (0–4 слота), не весь горизонт
  if (slots.length < dayStarts.length) {
    const quest = await client.quest.findUnique({
      where: { id: questId },
      select: { price: true },
    });
    if (!quest) return [];

    const have = new Set(slots.map((s) => s.startTime.getTime()));
    const missing = dayStarts.filter((s) => !have.has(s.getTime()));
    if (missing.length > 0) {
      await client.slot.createMany({
        data: missing.map((start) => ({
          questId,
          startTime: start,
          endTime: slotEndTime(start),
          price: quest.price,
          isBooked: false,
        })),
        skipDuplicates: true,
      });
      slots = await client.slot.findMany({
        where: {
          questId,
          startTime: { in: dayStarts },
        },
        orderBy: { startTime: "asc" },
      });
    }
  }

  const padMs = SESSION_BLOCK_MINUTES * 60_000;
  const blocking = await listBlockingBookings(client, now, {
    from: new Date(dayFrom.getTime() - padMs),
    to: new Date(dayTo.getTime() + padMs),
  });

  return slots.filter(
    (slot) => !isTimeRangeBlocked(slot.startTime, slot.endTime, blocking)
  );
}

export async function releaseSlotIfUnused(
  client: DbClient,
  slotId: string
): Promise<void> {
  const active = await client.booking.findFirst({
    where: {
      slotId,
      OR: [
        { status: "PAID" },
        { status: "PENDING", expiresAt: { gt: new Date() } },
      ],
    },
    select: { id: true },
  });
  if (!active) {
    await client.slot.update({
      where: { id: slotId },
      data: { isBooked: false },
    });
  }
}

export function invalidateScheduleCaches() {
  invalidateAdminData();
}
