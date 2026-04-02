"use server";

import { revalidatePath } from "next/cache";
import { endOfDay, startOfDay } from "date-fns";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type SlotOption = {
  id: string;
  startTime: string;
  endTime: string;
  price: string;
};

export async function getAvailableSlots(questId: string, dateStr: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "USER") {
    return { error: "Войдите как клиент, чтобы увидеть доступные слоты." as const };
  }

  let day: Date;
  try {
    day = new Date(`${dateStr}T12:00:00`);
    if (Number.isNaN(day.getTime())) {
      return { error: "Некорректная дата." as const };
    }
  } catch {
    return { error: "Некорректная дата." as const };
  }

  const from = startOfDay(day);
  const to = endOfDay(day);

  const slots = await prisma.slot.findMany({
    where: {
      questId,
      startTime: { gte: from, lte: to },
      isBooked: false,
      booking: null,
    },
    orderBy: { startTime: "asc" },
  });

  const options: SlotOption[] = slots.map((s) => ({
    id: s.id,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime.toISOString(),
    price: s.price.toString(),
  }));

  return { slots: options };
}

export async function createBooking(slotId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "USER") {
    return { error: "Для бронирования необходимо войти как клиент." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const slot = await tx.slot.findFirst({
        where: {
          id: slotId,
          isBooked: false,
          booking: null,
        },
      });
      if (!slot) {
        throw new Error("SLOT_TAKEN");
      }

      await tx.booking.create({
        data: {
          userId: session.user!.id,
          slotId,
          status: "PENDING",
        },
      });
    });

    revalidatePath("/");
    revalidatePath("/bookings");
    return { success: true as const };
  } catch (e) {
    if (e instanceof Error && e.message === "SLOT_TAKEN") {
      return { error: "Этот слот уже недоступен." };
    }
    return { error: "Не удалось оформить бронирование. Попробуйте еще раз." };
  }
}

export async function createPayment(bookingId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "USER") {
    return { error: "Для оплаты нужно войти как пользователь." };
  }

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId: session.user.id },
  });
  if (!booking) {
    return { error: "Бронирование не найдено." };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "PENDING", paymentId: `mock_${Date.now()}` },
  });

  revalidatePath("/profile");
  revalidatePath("/bookings");
  return { success: true as const };
}

export async function completeMockPayment(bookingId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "USER") {
    return { error: "Для оплаты нужно войти как пользователь." };
  }

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId: session.user.id },
    include: { slot: true },
  });
  if (!booking) {
    return { error: "Бронирование не найдено." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: "PAID", paymentId: booking.paymentId ?? `mock_${Date.now()}` },
    });
    await tx.slot.update({
      where: { id: booking.slotId },
      data: { isBooked: true },
    });
  });

  revalidatePath("/profile");
  revalidatePath("/bookings");
  revalidatePath("/admin");
  return { success: true as const };
}
