import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { markBookingPaid } from "@/lib/payments/complete-booking";
import { yookassaGetPayment } from "@/lib/payments/yookassa";

type YooWebhookBody = {
  type?: string;
  event?: string;
  object?: {
    id?: string;
    status?: string;
    metadata?: { bookingId?: string };
  };
};

export async function POST(request: Request) {
  let body: YooWebhookBody;
  try {
    body = (await request.json()) as YooWebhookBody;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const isSuccess =
    body.event === "payment.succeeded" || body.object?.status === "succeeded";
  if (!isSuccess) {
    return NextResponse.json({ ok: true });
  }

  const paymentId = body.object?.id;
  const bookingId = body.object?.metadata?.bookingId;
  if (!paymentId || !bookingId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const verified = await yookassaGetPayment(shopId, secretKey, paymentId);
  if (
    !verified ||
    verified.status !== "succeeded" ||
    verified.metadata?.bookingId !== bookingId
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const result = await markBookingPaid(bookingId, paymentId);
  if (!result.ok) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  revalidatePath("/profile");
  revalidatePath("/bookings");
  revalidatePath("/admin");

  return NextResponse.json({ ok: true });
}
