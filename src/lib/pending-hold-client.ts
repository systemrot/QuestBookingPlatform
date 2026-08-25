/** Клиентский быстрый флаг: не ждать server action, если холд уже известен. */

const STORAGE_KEY = "qb_pending_hold_until";
const UI_COOKIE = "qb_pending_hold_until";

export const PENDING_HOLD_EXISTS_MESSAGE =
  "У вас уже есть неоплаченная бронь. Оплатите или дождитесь снятия холда (20 мин).";

function readUiCookieExpires(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${UI_COOKIE}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(UI_COOKIE.length + 1));
}

export function setClientPendingHold(expiresAtIso: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, expiresAtIso);
  } catch {
    /* private mode / disabled */
  }
  if (typeof document !== "undefined") {
    const exp = Date.parse(expiresAtIso);
    const maxAge = Number.isFinite(exp)
      ? Math.max(1, Math.ceil((exp - Date.now()) / 1000))
      : 20 * 60;
    document.cookie = `${UI_COOKIE}=${encodeURIComponent(expiresAtIso)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  }
}

export function clearClientPendingHold() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  if (typeof document !== "undefined") {
    document.cookie = `${UI_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}

export function hasClientPendingHold(now = Date.now()) {
  try {
    const fromStorage = sessionStorage.getItem(STORAGE_KEY);
    if (fromStorage) {
      const exp = Date.parse(fromStorage);
      if (Number.isFinite(exp) && exp > now) return true;
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }

  const fromCookie = readUiCookieExpires();
  if (!fromCookie) return false;
  const exp = Date.parse(fromCookie);
  if (!Number.isFinite(exp) || exp <= now) {
    clearClientPendingHold();
    return false;
  }
  setClientPendingHold(fromCookie);
  return true;
}

/** Синхронизация с серверным списком броней (страница /bookings и т.п.). */
export function syncClientPendingHold(expiresAtIso: string | null) {
  if (expiresAtIso && Date.parse(expiresAtIso) > Date.now()) {
    setClientPendingHold(expiresAtIso);
  } else {
    clearClientPendingHold();
  }
}
