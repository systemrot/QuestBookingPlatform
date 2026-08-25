import { invalidateUserBookingData, invalidateAdminData } from "@/lib/cache";
import { invalidateAvailabilityCache } from "@/lib/availability";
import { clearPendingHoldMemory } from "@/lib/pending-hold";
import { dbUrgent } from "@/lib/prisma";

/** Помечает бронирование оплаченным и фиксирует слот (идемпотентно). */
export async function markBookingPaid(bookingId: string, paymentId: string | null) {
  // dbUrgent + без interactive $transaction: pooler (6543) их рвёт/вешает на 20–30с.
  return dbUrgent(async (prisma) => {
    const now = new Date();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        slotId: true,
        userId: true,
        expiresAt: true,
        slot: { select: { startTime: true, endTime: true } },
      },
    });
    if (!booking || booking.status === "CANCELLED") {
      return { ok: false as const, reason: "not_found" as const };
    }
    if (booking.status === "PAID") {
      clearPendingHoldMemory(booking.userId);
      return { ok: true as const, already: true as const };
    }
    if (booking.expiresAt && booking.expiresAt.getTime() <= now.getTime()) {
      return { ok: false as const, reason: "expired" as const };
    }

    const conflict = await prisma.booking.findFirst({
      where: {
        id: { not: bookingId },
        status: "PAID",
        slot: {
          startTime: { lt: booking.slot.endTime },
          endTime: { gt: booking.slot.startTime },
        },
      },
      select: { id: true },
    });
    if (conflict) {
      return { ok: false as const, reason: "conflict" as const };
    }

    // Один SQL вместо interactive transaction (PgBouncer-safe).
    await prisma.$executeRaw`
      WITH paid AS (
        UPDATE "Booking"
        SET status = 'PAID'::"BookingStatus",
            "expiresAt" = NULL,
            "paymentId" = COALESCE(${paymentId}, "paymentId"),
            "updatedAt" = NOW()
        WHERE id = ${bookingId}
          AND status = 'PENDING'::"BookingStatus"
        RETURNING "slotId"
      )
      UPDATE "Slot" s
      SET "isBooked" = true, "updatedAt" = NOW()
      FROM paid
      WHERE s.id = paid."slotId"
    `;

    const still = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { status: true },
    });
    if (still?.status !== "PAID") {
      return { ok: false as const, reason: "not_found" as const };
    }

    clearPendingHoldMemory(booking.userId);
    invalidateAvailabilityCache();
    invalidateUserBookingData(booking.userId);
    invalidateAdminData();
    return { ok: true as const, already: false as const };
  });
}
