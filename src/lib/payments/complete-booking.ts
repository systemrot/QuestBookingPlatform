import { prisma } from "@/lib/prisma";

/** Помечает бронирование оплаченным и фиксирует слот (идемпотентно). */
export async function markBookingPaid(bookingId: string, paymentId: string | null) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, status: true, slotId: true },
  });
  if (!booking || booking.status === "CANCELLED") {
    return { ok: false as const, reason: "not_found" as const };
  }
  if (booking.status === "PAID") {
    return { ok: true as const, already: true as const };
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "PAID",
        ...(paymentId != null ? { paymentId } : {}),
      },
    });
    await tx.slot.update({
      where: { id: booking.slotId },
      data: { isBooked: true },
    });
  });

  return { ok: true as const, already: false as const };
}
