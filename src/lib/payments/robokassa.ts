import { createHash } from "crypto";

/** Устойчивый числовой номер счёта для Robokassa (InvId), 1 … 2_000_000_000 */
export function robokassaInvoiceId(bookingId: string): number {
  const hex = createHash("sha256").update(bookingId).digest("hex").slice(0, 8);
  const n = parseInt(hex, 16);
  return (n % 1999999999) + 1;
}

function md5Upper(s: string) {
  return createHash("md5").update(s).digest("hex").toUpperCase();
}

/** Подпись для перехода на оплату: MD5(Login:OutSum:InvId:Password1) */
export function robokassaSignatureInit(login: string, outSum: string, invId: number, password1: string) {
  return md5Upper(`${login}:${outSum}:${invId}:${password1}`);
}

/** Подпись для ResultURL: MD5(OutSum:InvId:Password2) */
export function robokassaSignatureResult(outSum: string, invId: string, password2: string) {
  return md5Upper(`${outSum}:${invId}:${password2}`);
}

export function buildRobokassaPaymentUrl(params: {
  merchantLogin: string;
  outSum: string;
  invId: number;
  description: string;
  password1: string;
  isTest?: boolean;
  email?: string;
  resultUrl: string;
  successUrl: string;
  failUrl: string;
}) {
  const signature = robokassaSignatureInit(
    params.merchantLogin,
    params.outSum,
    params.invId,
    params.password1,
  );

  const u = new URL("https://auth.robokassa.ru/Merchant/Index.aspx");
  u.searchParams.set("MerchantLogin", params.merchantLogin);
  u.searchParams.set("OutSum", params.outSum);
  u.searchParams.set("InvId", String(params.invId));
  u.searchParams.set("Description", params.description);
  u.searchParams.set("SignatureValue", signature);
  u.searchParams.set("Culture", "ru");
  u.searchParams.set("Encoding", "utf-8");
  u.searchParams.set("ResultURL", params.resultUrl);
  u.searchParams.set("SuccessURL", params.successUrl);
  u.searchParams.set("FailURL", params.failUrl);
  if (params.email) u.searchParams.set("Email", params.email);
  if (params.isTest) u.searchParams.set("IsTest", "1");
  return u.toString();
}
