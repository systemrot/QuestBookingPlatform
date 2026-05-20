import { randomUUID } from "crypto";

type YooCreatePaymentResponse = {
  id: string;
  status: string;
  confirmation?: { confirmation_url?: string };
};

export async function
 yookassaCreatePayment(params: { 
  shopId: string;
  secretKey: string;
  amountValue: string;
  currency: string;
  description: string;
  returnUrl: string;
  bookingId: string;
  customerEmail: string;   // -- добавили
  idempotenceKey?: string;
}): Promise<{ paymentId: string; confirmationUrl: string }  | { error: string }
> {  
  const idempotenceKey = params.idempotenceKey ?? randomUUID();
  const auth = Buffer.from(`${params.shopId}:${params.secretKey}`).toString("base64");

  const body = {
    amount: { value: params.amountValue, currency: params.currency },
    capture: true,
    confirmation: { type: "redirect", return_url: params.returnUrl },
    description: params.description,
    metadata: { bookingId: params.bookingId },

    receipt: {
      customer: { email: params.customerEmail },
      items: [
        {
          description: params.description,
          quantity: "1.00",
          amount: { value: params.amountValue, currency: params.currency },
          vat_code: 1,
          payment_subject: "service",
          payment_mode: "full_payment",
        },
      ],
    },
  };

  const res = await fetch("https://api.yookassa.ru/v3/payments", { 
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Idempotence-Key": idempotenceKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as YooCreatePaymentResponse & { description?: string };

  if (!res.ok) {
    return { error: data.description ?? `YooKassa HTTP ${res.status}` };
  }

  const url = data.confirmation?.confirmation_url;
  if (!url) return { error: "ЮKassa не вернула ссылку на оплату." };

  return { paymentId: data.id, confirmationUrl: url };
}
      


export async function yookassaGetPayment(
  shopId: string,
  secretKey: string,
  paymentId: string,
): Promise<{ status: string; metadata?: { bookingId?: string } } | null> {
  const auth = Buffer.from(`${shopId}:${secretKey}`).toString("base64");
  const res = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    status: string;
    metadata?: { bookingId?: string };
  };
  return { status: data.status, metadata: data.metadata };
}

