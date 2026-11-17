"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { invalidateQuestCatalog, invalidateAdminData } from "@/lib/cache";
import { dbUrgent } from "@/lib/prisma";
import { validateQuestImageAlt } from "@/lib/quest-image-alt";
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
  imageAlt: string;
  price: string;
  cityId: string;
}) {
  const session = await ensureOwner();
  if (!session) return { error: "Недостаточно прав." as const };

  const title = input.title.trim();
  const description = input.description.trim() || null;
  const image = input.image.trim() || null;
  const altCheck = validateQuestImageAlt(input.imageAlt ?? "");
  if (!altCheck.ok) return { error: altCheck.error };
  const imageAlt = altCheck.value;
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
      const existing = await dbUrgent((prisma) =>
        prisma.quest.findUnique({
          where: { id: input.id },
          select: { cityId: true, sortOrder: true },
        })
      );
      if (!existing) return { error: "Квест не найден." as const };

      let sortOrder = existing.sortOrder;
      if (existing.cityId !== cityId) {
        const agg = await dbUrgent((prisma) =>
          prisma.quest.aggregate({
            where: { cityId, archivedAt: null },
            _max: { sortOrder: true },
          })
        );
        sortOrder = (agg._max.sortOrder ?? -1) + 1;
      }

      await dbUrgent((prisma) =>
        prisma.quest.update({
          where: { id: input.id },
          data: {
            title,
            description,
            image,
            imageAlt,
            price,
            cityId,
            sortOrder,
          },
        })
      );
    } else {
      const agg = await dbUrgent((prisma) =>
        prisma.quest.aggregate({
          where: { cityId, archivedAt: null },
          _max: { sortOrder: true },
        })
      );
      const sortOrder = (agg._max.sortOrder ?? -1) + 1;

      await dbUrgent((prisma) =>
        prisma.quest.create({
          data: {
            title,
            description,
            image,
            imageAlt,
            price,
            cityId,
            sortOrder,
            archivedAt: null,
          },
        })
      );
    }

    invalidateQuestCatalog();
    invalidateAdminData();
    revalidatePath("/");
    revalidatePath("/oryol");
    revalidatePath("/smolensk");
    revalidatePath("/admin/quests");
    return { success: true as const };
  } catch (e) {
    console.error("[upsertQuest]", e);
    return { error: "Не удалось сохранить квест." as const };
  }
}

export async function archiveQuest(id: string) {
  const session = await ensureOwner();
  if (!session) return { error: "Недостаточно прав." as const };
  if (!id) return { error: "Не указан квест." as const };

  try {
    const row = await dbUrgent((prisma) =>
      prisma.quest.findUnique({
        where: { id },
        select: { id: true, archivedAt: true },
      })
    );
    if (!row) return { error: "Квест не найден." as const };
    if (row.archivedAt) {
      return { error: "Квест уже в архиве." as const };
    }

    await dbUrgent((prisma) =>
      prisma.quest.update({
        where: { id },
        data: { archivedAt: new Date() },
      })
    );

    invalidateQuestCatalog();
    invalidateAdminData();
    revalidatePath("/");
    revalidatePath("/oryol");
    revalidatePath("/smolensk");
    revalidatePath("/admin/quests");
    return { success: true as const };
  } catch (e) {
    console.error("[archiveQuest]", e);
    return { error: "Не удалось архивировать квест." as const };
  }
}

export async function restoreQuest(id: string) {
  const session = await ensureOwner();
  if (!session) return { error: "Недостаточно прав." as const };
  if (!id) return { error: "Не указан квест." as const };

  try {
    const row = await dbUrgent((prisma) =>
      prisma.quest.findUnique({
        where: { id },
        select: { id: true, cityId: true, archivedAt: true },
      })
    );
    if (!row) return { error: "Квест не найден." as const };
    if (!row.archivedAt) {
      return { error: "Квест не в архиве." as const };
    }

    const agg = await dbUrgent((prisma) =>
      prisma.quest.aggregate({
        where: { cityId: row.cityId, archivedAt: null },
        _max: { sortOrder: true },
      })
    );
    const sortOrder = (agg._max.sortOrder ?? -1) + 1;

    await dbUrgent((prisma) =>
      prisma.quest.update({
        where: { id },
        data: { archivedAt: null, sortOrder },
      })
    );

    invalidateQuestCatalog();
    invalidateAdminData();
    revalidatePath("/");
    revalidatePath("/oryol");
    revalidatePath("/smolensk");
    revalidatePath("/admin/quests");
    return { success: true as const };
  } catch (e) {
    console.error("[restoreQuest]", e);
    return { error: "Не удалось вернуть квест из архива." as const };
  }
}

/** Hard-delete only archived quests (active ones must be archived first). */
export async function deleteQuest(id: string) {
  const session = await ensureOwner();
  if (!session) return { error: "Недостаточно прав." as const };
  if (!id) return { error: "Не указан квест." as const };

  try {
    const row = await dbUrgent((prisma) =>
      prisma.quest.findUnique({
        where: { id },
        select: { id: true, archivedAt: true },
      })
    );
    if (!row) return { error: "Квест не найден." as const };
    if (!row.archivedAt) {
      return {
        error: "Сначала архивируйте квест — удаление только из архива." as const,
      };
    }

    await dbUrgent((prisma) => prisma.quest.delete({ where: { id } }));
    invalidateQuestCatalog();
    invalidateAdminData();
    revalidatePath("/");
    revalidatePath("/oryol");
    revalidatePath("/smolensk");
    revalidatePath("/admin/quests");
    return { success: true as const };
  } catch (e) {
    console.error("[deleteQuest]", e);
    return {
      error: "Не удалось удалить. Возможно, есть связанные брони." as const,
    };
  }
}

/** Persist catalog order for one city after admin drag-and-drop. */
export async function reorderQuests(input: {
  cityId: string;
  orderedIds: string[];
}) {
  const session = await ensureOwner();
  if (!session) return { error: "Недостаточно прав." as const };

  const cityId = input.cityId.trim();
  const orderedIds = input.orderedIds.filter(Boolean);
  if (!cityId) return { error: "Не указан город." as const };
  if (orderedIds.length === 0) {
    return { error: "Пустой порядок квестов." as const };
  }
  if (new Set(orderedIds).size !== orderedIds.length) {
    return { error: "Дубликаты в порядке квестов." as const };
  }

  try {
    const rows = await dbUrgent((prisma) =>
      prisma.quest.findMany({
        where: { cityId, archivedAt: null },
        select: { id: true },
      })
    );
    const existing = new Set(rows.map((r) => r.id));
    if (
      existing.size !== orderedIds.length ||
      orderedIds.some((id) => !existing.has(id))
    ) {
      return { error: "Список квестов устарел — обновите страницу." as const };
    }

    await dbUrgent(async (prisma) => {
      await prisma.$transaction(
        orderedIds.map((id, index) =>
          prisma.quest.update({
            where: { id },
            data: { sortOrder: index },
          })
        )
      );
    });

    invalidateQuestCatalog();
    invalidateAdminData();
    revalidatePath("/");
    revalidatePath("/oryol");
    revalidatePath("/smolensk");
    revalidatePath("/admin/quests");
    return { success: true as const };
  } catch (e) {
    console.error("[reorderQuests]", e);
    return { error: "Не удалось сохранить порядок." as const };
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

const STAFF_MUTABLE_ROLES = ["USER", "ADMIN"] as const;
type StaffMutableRole = (typeof STAFF_MUTABLE_ROLES)[number];

function isStaffMutableRole(role: unknown): role is StaffMutableRole {
  return role === "USER" || role === "ADMIN";
}

/** OWNER-only: promote/demote USER ↔ ADMIN. Never touches OWNER. */
export async function setStaffRole(input: {
  userId: string;
  role: StaffMutableRole;
}) {
  const session = await ensureOwner();
  if (!session?.user?.id) return { error: "Недостаточно прав." as const };

  const userId = input.userId.trim();
  if (!userId) return { error: "Не указан пользователь." as const };
  if (!isStaffMutableRole(input.role)) {
    return { error: "Допустимы только роли USER и ADMIN." as const };
  }
  if (userId === session.user.id) {
    return { error: "Нельзя менять свою роль." as const };
  }

  try {
    const target = await dbUrgent((prisma) =>
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, name: true },
      })
    );
    if (!target) return { error: "Пользователь не найден." as const };
    if (!isStaffMutableRole(target.role)) {
      return { error: "Роль владельца нельзя изменить через интерфейс." as const };
    }
    if (target.role === input.role) {
      return { success: true as const, name: target.name };
    }

    await dbUrgent((prisma) =>
      prisma.user.update({
        where: { id: target.id },
        data: { role: input.role },
      })
    );

    revalidatePath("/admin/team");
    return { success: true as const, name: target.name };
  } catch (e) {
    console.error("[setStaffRole]", e);
    return { error: "Не удалось изменить роль." as const };
  }
}

/** OWNER-only: promote an existing USER to ADMIN by exact email. */
export async function grantAdminByEmail(emailRaw: string) {
  const session = await ensureOwner();
  if (!session?.user?.id) return { error: "Недостаточно прав." as const };

  const email = emailRaw.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: "Укажите корректный email." as const };
  }

  try {
    const target = await dbUrgent((prisma) =>
      prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true, role: true, name: true, email: true },
      })
    );
    if (!target) {
      return {
        error: "Пользователь с таким email не найден. Сначала пусть зарегистрируется." as const,
      };
    }
    if (target.id === session.user.id) {
      return { error: "Нельзя менять свою роль." as const };
    }
    if (target.role === "OWNER") {
      return { error: "Роль владельца нельзя изменить через интерфейс." as const };
    }
    if (target.role === "ADMIN") {
      return { error: "Этот пользователь уже администратор." as const };
    }

    await dbUrgent((prisma) =>
      prisma.user.update({
        where: { id: target.id },
        data: { role: "ADMIN" },
      })
    );

    revalidatePath("/admin/team");
    return { success: true as const, name: target.name, email: target.email };
  } catch (e) {
    console.error("[grantAdminByEmail]", e);
    return { error: "Не удалось выдать права." as const };
  }
}
