"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { dbUrgent } from "@/lib/prisma";
import { getAppBaseUrl, getPaymentProvider } from "@/lib/payments/config";
import {
  buildRobokassaPaymentUrl,
  robokassaInvoiceId,
} from "@/lib/payments/robokassa";
import { markBookingPaid } from "@/lib/payments/complete-booking";
import { invalidateUserBookingData } from "@/lib/cache";
import { clearPendingHoldMemory } from "@/lib/pending-hold";

import { yookassaCreatePayment } from "@/lib/payments/yookassa";

export type StartPaymentResult =
  | { success: true }
  | { redirectUrl: string }
  | { error: string };

/**
 * Подготовка оплаты: PENDING + создание платежа у провайдера или режим mock.
 */
export async function startBookingPayment(bookingId: string): Promise<StartPaymentResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "USER") {
    return { error: "Для оплаты нужно войти как пользователь." };
  }

  const userId = session.user.id;

  try {
    const booking = await dbUrgent((prisma) =>
      prisma.booking.findFirst({
        where: { id: bookingId, userId },
        select: {
          id: true,
          status: true,
          expiresAt: true,
          slot: { select: { quest: { select: { title: true } } } },
          user: { select: { email: true } },
        },
      })
    );

    if (!booking) {
      return { error: "Бронирование не найдено." };
    }
    if (booking.status === "PAID") {
      return { error: "Бронирование уже оплачено." };
    }
    if (booking.status === "CANCELLED") {
      return { error: "Бронирование отменено." };
    }
    if (
      booking.status === "PENDING" &&
      booking.expiresAt &&
      booking.expiresAt.getTime() <= Date.now()
    ) {
      return { error: "Время на оплату истекло. Выберите слот заново." };
    }

    const provider = getPaymentProvider();
    const base = getAppBaseUrl();
    const amount = "500.00";
    const description = `Квест: ${booking.slot.quest.title}`;

    if (provider === "mock") {
      const paymentId = `mock_${Date.now()}`;
      const marked = await markBookingPaid(bookingId, paymentId);
      if (!marked.ok) {
        if (marked.reason === "expired") {
          return { error: "Время на оплату истекло. Выберите слот заново." };
        }
        if (marked.reason === "conflict") {
          return { error: "Это время уже занято другой оплаченной бронью." };
        }
        return { error: "Не удалось подтвердить оплату. Попробуйте ещё раз." };
      }
      // Только память — cookies из RSC/action уже ок, но clearPendingHold лишний RTT не нужен.
      clearPendingHoldMemory(userId);
      invalidateUserBookingData(userId);
      revalidatePath("/profile");
      revalidatePath("/bookings");
      revalidatePath("/admin");
      return { success: true };
    }

    if (provider === "yookassa") {
      const shopId = process.env.YOOKASSA_SHOP_ID!;
      const secretKey = process.env.YOOKASSA_SECRET_KEY!;
      const created = await yookassaCreatePayment({
        shopId,
        secretKey,
        amountValue: amount,
        currency: "RUB",
        description,
        returnUrl: `${base}/payment/return`,
        bookingId,
        customerEmail: booking.user.email ?? "no-reply@nekvest.ru",
      });
      if ("error" in created) {
        return { error: created.error };
      }
      await dbUrgent((prisma) =>
        prisma.booking.update({
          where: { id: bookingId },
          data: { status: "PENDING", paymentId: created.paymentId },
        })
      );
      revalidatePath("/profile");
      revalidatePath("/bookings");
      return { redirectUrl: created.confirmationUrl };
    }

    if (provider === "robokassa") {
      const login = process.env.ROBOKASSA_MERCHANT_LOGIN!;
      const pass1 = process.env.ROBOKASSA_PASSWORD_1!;
      const isTest =
        process.env.ROBOKASSA_TEST === "1" || process.env.ROBOKASSA_TEST === "true";

      const invId = robokassaInvoiceId(bookingId);
      const paymentRef = `robokassa:${invId}`;

      await dbUrgent((prisma) =>
        prisma.booking.update({
          where: { id: bookingId },
          data: { status: "PENDING", paymentId: paymentRef },
        })
      );

      const resultUrl = `${base}/api/payments/robokassa/result`;
      const successUrl = `${base}/payment/return?status=success`;
      const failUrl = `${base}/payment/return?status=fail`;

      const redirectUrl = buildRobokassaPaymentUrl({
        merchantLogin: login,
        outSum: amount,
        invId,
        description,
        password1: pass1,
        isTest,
        email: booking.user.email ?? undefined,
        resultUrl,
        successUrl,
        failUrl,
      });

      revalidatePath("/profile");
      revalidatePath("/bookings");
      return { redirectUrl };
    }

    return { error: "Платёжный провайдер не настроен." };
  } catch (e) {
    console.error("[startBookingPayment]", e);
    return {
      error: "Нет связи с базой. Подождите пару секунд и нажмите «Оплатить» ещё раз.",
    };
  }
}
