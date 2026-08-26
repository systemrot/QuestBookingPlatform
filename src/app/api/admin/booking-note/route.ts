import { auth } from "@/auth";
import { invalidateAdminData } from "@/lib/cache";
import { dbUrgent } from "@/lib/prisma";

const NOTE_MAX = 1000;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return Response.json({ error: "Недостаточно прав." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный запрос." }, { status: 400 });
  }

  const bookingId =
    typeof body === "object" &&
    body &&
    "bookingId" in body &&
    typeof (body as { bookingId: unknown }).bookingId === "string"
      ? (body as { bookingId: string }).bookingId.trim()
      : "";

  const rawNote =
    typeof body === "object" &&
    body &&
    "note" in body &&
    typeof (body as { note: unknown }).note === "string"
      ? (body as { note: string }).note
      : null;

  if (!bookingId || rawNote === null) {
    return Response.json(
      { error: "Нужны bookingId и note." },
      { status: 400 }
    );
  }

  const note = rawNote.trim().slice(0, NOTE_MAX);
  const noteValue = note.length > 0 ? note : null;

  try {
    const updated = await dbUrgent(async (prisma) => {
      // $executeRaw — не зависит от устаревшего Prisma Client после generate.
      const result = await prisma.$executeRaw`
        UPDATE "Booking"
        SET note = ${noteValue}, "updatedAt" = NOW()
        WHERE id = ${bookingId}
      `;
      if (result === 0) return null;
      const rows = await prisma.$queryRaw<{ note: string | null }[]>`
        SELECT note FROM "Booking" WHERE id = ${bookingId} LIMIT 1
      `;
      return rows[0] ?? { note: noteValue };
    });

    if (!updated) {
      return Response.json({ error: "Бронь не найдена." }, { status: 404 });
    }

    invalidateAdminData();
    return Response.json({
      success: true as const,
      note: updated.note ?? "",
    });
  } catch (e) {
    console.error("[api/admin/booking-note]", e);
    return Response.json(
      { error: "Не удалось сохранить заметку." },
      { status: 500 }
    );
  }
}
