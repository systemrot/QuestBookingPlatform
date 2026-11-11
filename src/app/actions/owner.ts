"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { invalidateQuestCatalog, invalidateAdminData } from "@/lib/cache";
import { dbUrgent } from "@/lib/prisma";
import { isOwner } from "@/lib/roles";

function ensureOwner() {
  return auth().then((session) => {
    if (!session?.user?.id || !isOwner(session.user.role)) {
      return null;
    }
    return session;
  });
}

function parsePrice(raw: string): number | null {
  const n = Number(String(raw).replace(",", ".").trim());
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) return null;
  return Math.round(n * 100) / 100;
}

function parseRate(raw: string): number | null {
  const n = Number(String(raw).replace(",", ".").trim());
  if (!Number.isFinite(n) || n < 0 || n > 100_000) return null;
  return Math.round(n * 100) / 100;
}

export async function upsertQuest(input: {
  id?: string;
  title: string;
  description: string;
  image: string;
  price: string;
  cityId: string;
}) {
  const session = await ensureOwner();
  if (!session) return { error: "Недостаточно прав." as const };

  const title = input.title.trim();
  const description = input.description.trim() || null;
  const image = input.image.trim() || null;
  const price = parsePrice(input.price);
  const cityId = input.cityId.trim();

  if (!title || title.length > 120) {
    return { error: "Укажите название квеста (до 120 символов)." as const };
  }
  if (price == null) return { error: "Некорректная цена." as const };
  if (!cityId) return { error: "Выберите город." as const };

  try {
    const city = await dbUrgent((prisma) =>
      prisma.city.findUnique({ where: { id: cityId }, select: { id: true } })
    );
    if (!city) return { error: "Город не найден." as const };

    if (input.id) {
      await dbUrgent((prisma) =>
        prisma.quest.update({
          where: { id: input.id },
          data: { title, description, image, price, cityId },
        })
      );
    } else {
      await dbUrgent((prisma) =>
        prisma.quest.create({
          data: { title, description, image, price, cityId },
        })
      );
    }

    invalidateQuestCatalog();
    invalidateAdminData();
    revalidatePath("/");
    revalidatePath("/admin/quests");
    return { success: true as const };
  } catch (e) {
    console.error("[upsertQuest]", e);
    return { error: "Не удалось сохранить квест." as const };
  }
}

export async function deleteQuest(id: string) {
  const session = await ensureOwner();
  if (!session) return { error: "Недостаточно прав." as const };
  if (!id) return { error: "Не указан квест." as const };

  try {
    await dbUrgent((prisma) => prisma.quest.delete({ where: { id } }));
    invalidateQuestCatalog();
    invalidateAdminData();
    revalidatePath("/");
    revalidatePath("/admin/quests");
    return { success: true as const };
  } catch (e) {
    console.error("[deleteQuest]", e);
    return {
      error: "Не удалось удалить. Возможно, есть связанные брони." as const,
    };
  }
}

export async function upsertActor(input: {
  id?: string;
  name: string;
  hourlyRate: string;
  cityId: string;
}) {
  const session = await ensureOwner();
  if (!session) return { error: "Недостаточно прав." as const };

  const name = input.name.trim();
  const hourlyRate = parseRate(input.hourlyRate);
  const cityId = input.cityId.trim();

  if (!name || name.length > 80) {
    return { error: "Укажите имя актёра (до 80 символов)." as const };
  }
  if (hourlyRate == null) return { error: "Некорректная ставка." as const };
  if (!cityId) return { error: "Выберите город." as const };

  try {
    const city = await dbUrgent((prisma) =>
      prisma.city.findUnique({ where: { id: cityId }, select: { id: true } })
    );
    if (!city) return { error: "Город не найден." as const };

    if (input.id) {
      await dbUrgent((prisma) =>
        prisma.actor.update({
          where: { id: input.id },
          data: { name, hourlyRate, cityId },
        })
      );
    } else {
      await dbUrgent((prisma) =>
        prisma.actor.create({
          data: { name, hourlyRate, cityId },
        })
      );
    }

    invalidateAdminData();
    revalidatePath("/admin/actors");
    revalidatePath("/admin");
    revalidatePath("/admin/reports");
    return { success: true as const };
  } catch (e) {
    console.error("[upsertActor]", e);
    return { error: "Не удалось сохранить актёра." as const };
  }
}

export async function deleteActor(id: string) {
  const session = await ensureOwner();
  if (!session) return { error: "Недостаточно прав." as const };
  if (!id) return { error: "Не указан актёр." as const };

  try {
    await dbUrgent((prisma) => prisma.actor.delete({ where: { id } }));
    invalidateAdminData();
    revalidatePath("/admin/actors");
    revalidatePath("/admin");
    revalidatePath("/admin/reports");
    return { success: true as const };
  } catch (e) {
    console.error("[deleteActor]", e);
    return { error: "Не удалось удалить актёра." as const };
  }
}
