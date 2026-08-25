import {
  listScheduleStarts,
  makeVirtualSlotId,
  rangesOverlap,
  slotEndTime,
} from "@/lib/booking-policy";
import { dbUrgent } from "@/lib/prisma";

export type VirtualSlotOption = {
  id: string;
  startTime: string;
  endTime: string;
  price: string;
};

type BlockRange = { start: number; end: number };

type AvailGlobal = {
  availBlockCache?: { fetchedAt: number; ranges: BlockRange[] };
};

const g = globalThis as unknown as AvailGlobal;

/** Короткий in-memory кэш занятых окон — список слотов почти без ожидания БД. */
const BLOCK_CACHE_TTL_MS = 15_000;

export function invalidateAvailabilityCache() {
  delete g.availBlockCache;
}

export {
  makeVirtualSlotId,
  parseVirtualSlotId,
} from "@/lib/booking-policy";

async function fetchBlockedRanges(now: Date): Promise<BlockRange[]> {
  const rows = await dbUrgent((prisma) =>
    prisma.booking.findMany({
      where: {
        OR: [
          { status: "PAID" },
          { status: "PENDING", expiresAt: { gt: now } },
        ],
        slot: {
          endTime: { gte: now },
        },
      },
      select: {
        slot: { select: { startTime: true, endTime: true } },
      },
    })
  );

  return rows.map((r) => ({
    start: r.slot.startTime.getTime(),
    end: r.slot.endTime.getTime(),
  }));
}

export async function getBlockedRanges(now: Date = new Date()): Promise<BlockRange[]> {
  const cached = g.availBlockCache;
  if (cached && Date.now() - cached.fetchedAt < BLOCK_CACHE_TTL_MS) {
    return cached.ranges;
  }

  const ranges = await fetchBlockedRanges(now);
  g.availBlockCache = { fetchedAt: Date.now(), ranges };
  return ranges;
}

/**
 * Расписание считается в памяти; в БД только проверка занятых окон (с кэшем ~15с).
 * ID вида v:{questId}:{iso} — слот в БД создаётся при бронировании.
 */
export async function listVirtualAvailableSlots(
  questId: string,
  dayFrom: Date,
  dayTo: Date,
  price: string,
  now: Date = new Date()
): Promise<VirtualSlotOption[]> {
  const dayStarts = listScheduleStarts(now).filter(
    (s) => s.getTime() >= dayFrom.getTime() && s.getTime() <= dayTo.getTime()
  );
  if (dayStarts.length === 0) return [];

  const blocked = await getBlockedRanges(now);

  return dayStarts
    .filter((start) => {
      const end = slotEndTime(start);
      return !blocked.some((b) =>
        rangesOverlap(start, end, new Date(b.start), new Date(b.end))
      );
    })
    .map((start) => ({
      id: makeVirtualSlotId(questId, start),
      startTime: start.toISOString(),
      endTime: slotEndTime(start).toISOString(),
      price,
    }));
}
