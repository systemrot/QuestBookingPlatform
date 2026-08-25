import { dbUrgent } from "@/lib/prisma";

/** Удаляет только отменённые / просроченные холды текущего пользователя. */
export async function deleteUserCancelledBookings(
  userId: string,
  bookingIds: string[]
): Promise<{ deleted: number }> {
  const uniqueIds = [
    ...new Set(bookingIds.filter((id) => typeof id === "string" && id.length > 0)),
  ];
  if (uniqueIds.length === 0) return { deleted: 0 };

  const now = new Date();

  return dbUrgent(async (prisma) => {
    const result = await prisma.booking.deleteMany({
      where: {
        userId,
        id: { in: uniqueIds },
        OR: [
          { status: "CANCELLED" },
          {
            status: "PENDING",
            expiresAt: { not: null, lte: now },
          },
        ],
      },
    });
    return { deleted: result.count };
  });
}
