import { auth } from "@/auth";
import { invalidateUserBookingData } from "@/lib/cache";
import { deleteUserCancelledBookings } from "@/lib/delete-cancelled-bookings";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "USER") {
    return Response.json({ error: "Недостаточно прав." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный запрос." }, { status: 400 });
  }

  const ids =
    typeof body === "object" &&
    body &&
    "ids" in body &&
    Array.isArray((body as { ids: unknown }).ids)
      ? (body as { ids: unknown[] }).ids.filter(
          (id): id is string => typeof id === "string"
        )
      : null;

  if (!ids || ids.length === 0) {
    return Response.json({ error: "Не выбраны бронирования." }, { status: 400 });
  }

  try {
    const { deleted } = await deleteUserCancelledBookings(session.user.id, ids);
    invalidateUserBookingData(session.user.id);
    return Response.json({ success: true as const, deleted });
  } catch (e) {
    console.error("[api/bookings/delete-cancelled]", e);
    return Response.json(
      { error: "Не удалось удалить. Попробуйте ещё раз." },
      { status: 500 }
    );
  }
}
