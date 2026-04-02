"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl, getPaymentProvider } from "@/lib/payments/config";
import {
  buildRobokassaPaymentUrl,
  robokassaInvoiceId,
} from "@/lib/payments/robokassa";
import { yookassaCreatePayment } from "@/lib/payments/yookassa";

export type StartPaymentResult =
  | { mock: true }
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

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId: session.user.id },
    include: {
      slot: { include: { quest: { select: { title: true } } } },
      user: { select: { email: true } },
    },
  });

  if (!booking) {
    return { error: "Бронирование не найдено." };
  }
  if (booking.status === "PAID") {
    return { error: "Бронирование уже оплачено." };
  }
  if (booking.status === "CANCELLED") {
    return { error: "Бронирование отменено." };
  }

  const provider = getPaymentProvider();
  const base = getAppBaseUrl();
  const amount = Number(booking.slot.price).toFixed(2);
  const description = `Квест: ${booking.slot.quest.title}`;

  if (provider === "mock") {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "PENDING", paymentId: `mock_${Date.now()}` },
    });
    revalidatePath("/profile");
    revalidatePath("/bookings");
    return { mock: true };
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
    });
    if ("error" in created) {
      return { error: created.error };
    }
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "PENDING", paymentId: created.paymentId },
    });
    revalidatePath("/profile");
    revalidatePath("/bookings");
    return { redirectUrl: created.confirmationUrl };
  }

  if (provider === "robokassa") {
    const login = process.env.ROBOKASSA_MERCHANT_LOGIN!;
    const pass1 = process.env.ROBOKASSA_PASSWORD_1!;
    const isTest = process.env.ROBOKASSA_TEST === "1" || process.env.ROBOKASSA_TEST === "true";

    const invId = robokassaInvoiceId(bookingId);
    const paymentRef = `robokassa:${invId}`;

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "PENDING", paymentId: paymentRef },
    });

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
}
