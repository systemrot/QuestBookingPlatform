export type PaymentProvider = "mock" | "yookassa" | "robokassa";

export function getPaymentProvider(): PaymentProvider {
  const p = (process.env.PAYMENT_PROVIDER ?? "").toLowerCase();
  if (p === "yookassa" && process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY) {
    return "yookassa";
  }
  if (
    p === "robokassa" &&
    process.env.ROBOKASSA_MERCHANT_LOGIN &&
    process.env.ROBOKASSA_PASSWORD_1 &&
    process.env.ROBOKASSA_PASSWORD_2
  ) {
    return "robokassa";
  }
  return "mock";
}

export function getAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}
