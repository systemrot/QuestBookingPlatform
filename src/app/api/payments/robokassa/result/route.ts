import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { markBookingPaid } from "@/lib/payments/complete-booking";
import { robokassaSignatureResult } from "@/lib/payments/robokassa";

async function collectParams(request: Request): Promise<URLSearchParams> {
  const url = new URL(request.url);
  const params = new URLSearchParams(url.searchParams);
  if (request.method !== "POST") {
    return params;
  }
  const ct = request.headers.get("content-type") ?? "";
  if (
    ct.includes("application/x-www-form-urlencoded") ||
    ct.includes("multipart/form-data")
  ) {
    const fd = await request.formData();
    fd.forEach((v, k) => {
      params.set(k, String(v));
    });
  }
  return params;
}

async function processRobokassaCallback(params: URLSearchParams) {
  const outSum = params.get("OutSum");
  const invIdRaw = params.get("InvId");
  const signature = params.get("SignatureValue") ?? params.get("crc");

  if (!outSum || !invIdRaw || !signature) {
    return new NextResponse("bad request", { status: 400 });
  }

  const pass2 = process.env.ROBOKASSA_PASSWORD_2;
  if (!pass2) {
    return new NextResponse("config", { status: 500 });
  }

  const expected = robokassaSignatureResult(outSum, invIdRaw, pass2);
  if (expected !== signature.toUpperCase()) {
    return new NextResponse("bad sign", { status: 403 });
  }

  const invId = parseInt(invIdRaw, 10);
  if (Number.isNaN(invId)) {
    return new NextResponse("bad inv", { status: 400 });
  }

  const paymentRef = `robokassa:${invId}`;
  const booking = await prisma.booking.findFirst({
    where: { paymentId: paymentRef },
    select: { id: true },
  });
  if (!booking) {
    return new NextResponse("not found", { status: 404 });
  }

  const result = await markBookingPaid(booking.id, paymentRef);
  if (!result.ok) {
    return new NextResponse("fail", { status: 400 });
  }

  revalidatePath("/profile");
  revalidatePath("/bookings");
  revalidatePath("/admin");

  return new NextResponse(`OK${invIdRaw}`, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function GET(request: Request) {
  const params = await collectParams(request);
  return processRobokassaCallback(params);
}

export async function POST(request: Request) {
  const params = await collectParams(request);
  return processRobokassaCallback(params);
}
