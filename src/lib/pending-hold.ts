import { cookies } from "next/headers";

import { PAYMENT_HOLD_MINUTES } from "@/lib/booking-policy";

/** httpOnly: сервер отсекает повторную бронь без похода в БД. */
export const PENDING_HOLD_COOKIE = "qb_pending_hold";
/** Читается в браузере — мгновенный отказ до server action. */
export const PENDING_HOLD_UI_COOKIE = "qb_pending_hold_until";

type HoldGlobal = {
  pendingHoldByUser?: Map<string, number>;
};

const g = globalThis as unknown as HoldGlobal;

function memoryMap() {
  if (!g.pendingHoldByUser) g.pendingHoldByUser = new Map();
  return g.pendingHoldByUser;
}

export const PENDING_HOLD_EXISTS_MESSAGE =
  "У вас уже есть неоплаченная бронь. Оплатите или дождитесь снятия холда (20 мин).";

export function rememberPendingHoldMemory(userId: string, expiresAt: Date) {
  memoryMap().set(userId, expiresAt.getTime());
}

export function clearPendingHoldMemory(userId: string) {
  memoryMap().delete(userId);
}

export function hasPendingHoldMemory(userId: string, now = Date.now()) {
  const exp = memoryMap().get(userId);
  if (exp == null) return false;
  if (exp <= now) {
    memoryMap().delete(userId);
    return false;
  }
  return true;
}

function maxAgeSeconds(expiresAt: Date) {
  return Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 1000));
}

const cookieBase = {
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

/** Ставит cookie холда (для этого браузера) + память процесса. */
export async function markPendingHold(userId: string, expiresAt: Date) {
  rememberPendingHoldMemory(userId, expiresAt);
  const store = await cookies();
  const maxAge = maxAgeSeconds(expiresAt);
  store.set(PENDING_HOLD_COOKIE, "1", {
    ...cookieBase,
    httpOnly: true,
    maxAge,
  });
  store.set(PENDING_HOLD_UI_COOKIE, expiresAt.toISOString(), {
    ...cookieBase,
    httpOnly: false,
    maxAge,
  });
}

export async function clearPendingHold(userId?: string) {
  if (userId) clearPendingHoldMemory(userId);
  const store = await cookies();
  store.delete(PENDING_HOLD_COOKIE);
  store.delete(PENDING_HOLD_UI_COOKIE);
}

/** Быстрая проверка до SQL: только память процесса (админ может сбросить).
 * Cookie не используем как жёсткий блок — после снятия админом cookie у клиента
 * остаётся и ложно запрещает новую бронь. */
export async function hasKnownPendingHold(userId: string) {
  return hasPendingHoldMemory(userId);
}

export function defaultHoldExpiresAt(from = new Date()) {
  return new Date(from.getTime() + PAYMENT_HOLD_MINUTES * 60_000);
}
