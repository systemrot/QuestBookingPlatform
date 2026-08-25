import { auth } from "@/auth";
import { invalidateAdminData } from "@/lib/cache";
import { syncSlotActors } from "@/lib/slot-actors";

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

  const slotId =
    typeof body === "object" &&
    body &&
    "slotId" in body &&
    typeof (body as { slotId: unknown }).slotId === "string"
      ? (body as { slotId: string }).slotId
      : "";
  const actorIds =
    typeof body === "object" &&
    body &&
    "actorIds" in body &&
    Array.isArray((body as { actorIds: unknown }).actorIds)
      ? (body as { actorIds: unknown[] }).actorIds.filter(
          (id): id is string => typeof id === "string"
        )
      : null;

  if (!slotId || actorIds === null) {
    return Response.json(
      { error: "Нужны slotId и actorIds." },
      { status: 400 }
    );
  }

  try {
    const result = await syncSlotActors(slotId, actorIds);
    if (!result.ok) {
      if (result.error === "missing_slot") {
        return Response.json({ error: "Слот не найден." }, { status: 404 });
      }
      if (result.error === "missing_actors") {
        return Response.json(
          { error: "Один из актёров не найден." },
          { status: 400 }
        );
      }
      return Response.json(
        { error: "Не удалось сохранить актёров. Попробуйте ещё раз." },
        { status: 500 }
      );
    }

    invalidateAdminData();
    return Response.json({ success: true as const });
  } catch (e) {
    console.error("[api/admin/slot-actors]", e);
    return Response.json(
      { error: "Не удалось сохранить актёров. Попробуйте ещё раз." },
      { status: 500 }
    );
  }
}
