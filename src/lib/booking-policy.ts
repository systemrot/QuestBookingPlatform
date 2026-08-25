/** Правила слотов и холда. Все «настенные» времена — Europe/Moscow (UTC+3, без DST). */

export const BOOKING_TIME_ZONE = "Europe/Moscow";
/** Москва без перехода на летнее время с 2014. */
const MOSCOW_OFFSET = "+03:00";

/** Игра ~60 мин + буфер на задержки. */
export const SESSION_BLOCK_MINUTES = 90;

/** Старт следующего сеанса не чаще чем раз в 2 часа. */
export const SLOT_INTERVAL_HOURS = 2;

/** Будни (пн–чт): после обеда / вечер, без позднего 22:00. */
export const WEEKDAY_START_HOURS = [15, 17, 19, 21] as const;

/** Пт–вс — на час раньше, больше окон для компаний. */
export const WEEKEND_START_HOURS = [13, 15, 17, 19, 21] as const;

/** Горизонт записи вперёд (дней). */
export const BOOKING_HORIZON_DAYS = 14;

/** Нельзя взять слот, если до старта меньше этого. */
export const MIN_NOTICE_HOURS = 3;

/** PENDING держит слот и должен быть оплачен за это время. */
export const PAYMENT_HOLD_MINUTES = 20;

export type MoscowParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** 0 = вс … 6 = сб (как Date.getDay). */
  weekday: number;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function getMoscowParts(date: Date = new Date()): MoscowParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BOOKING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    weekday: weekdayMap[map.weekday] ?? 0,
  };
}

/** Дата/время по московским цифрам → UTC Instant. */
export function moscowDateTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0
): Date {
  return new Date(
    `${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}:00${MOSCOW_OFFSET}`
  );
}

export function addMoscowDays(parts: MoscowParts, days: number): MoscowParts {
  const utc = moscowDateTime(parts.year, parts.month, parts.day, 12, 0);
  utc.setUTCDate(utc.getUTCDate() + days);
  return getMoscowParts(utc);
}

export function startHoursForWeekday(weekday: number): readonly number[] {
  // Пт(5), Сб(6), Вс(0)
  if (weekday === 0 || weekday === 5 || weekday === 6) {
    return WEEKEND_START_HOURS;
  }
  return WEEKDAY_START_HOURS;
}

export function paymentHoldExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + PAYMENT_HOLD_MINUTES * 60_000);
}

export function minBookableStart(from: Date = new Date()): Date {
  return new Date(from.getTime() + MIN_NOTICE_HOURS * 60 * 60_000);
}

export function horizonEnd(from: Date = new Date()): Date {
  const parts = getMoscowParts(from);
  const endParts = addMoscowDays(parts, BOOKING_HORIZON_DAYS);
  // конец последнего дня горизонта (23:59:59.999 MSK)
  return moscowDateTime(endParts.year, endParts.month, endParts.day, 23, 59);
}

/** Все старты сетки от «сегодня» MSK на BOOKING_HORIZON_DAYS дней. */
export function listScheduleStarts(from: Date = new Date()): Date[] {
  const starts: Date[] = [];
  const today = getMoscowParts(from);
  const minStart = minBookableStart(from).getTime();
  const horizon = horizonEnd(from).getTime();

  for (let d = 0; d <= BOOKING_HORIZON_DAYS; d++) {
    const day = addMoscowDays(today, d);
    for (const hour of startHoursForWeekday(day.weekday)) {
      const start = moscowDateTime(day.year, day.month, day.day, hour, 0);
      const t = start.getTime();
      if (t >= minStart && t <= horizon) {
        starts.push(start);
      }
    }
  }

  return starts;
}

/** Дни, на которые есть хотя бы один слот в горизонте (для выбора даты в UI). */
export function listBookableDays(from: Date = new Date()): Date[] {
  const seen = new Set<string>();
  const days: Date[] = [];
  for (const start of listScheduleStarts(from)) {
    const p = getMoscowParts(start);
    const key = `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    days.push(moscowDateTime(p.year, p.month, p.day, 12, 0));
  }
  return days;
}

export function toMoscowDateKey(date: Date): string {
  const p = getMoscowParts(date);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}

export function slotEndTime(start: Date): Date {
  return new Date(start.getTime() + SESSION_BLOCK_MINUTES * 60_000);
}

/** Виртуальный id слота (без строки в БД до бронирования). */
export function makeVirtualSlotId(questId: string, start: Date) {
  return `v:${questId}:${start.toISOString()}`;
}

export function parseVirtualSlotId(
  id: string
): { questId: string; start: Date } | null {
  if (!id.startsWith("v:")) return null;
  const rest = id.slice(2);
  const sep = rest.indexOf(":");
  if (sep <= 0) return null;
  const questId = rest.slice(0, sep);
  const start = new Date(rest.slice(sep + 1));
  if (!questId || Number.isNaN(start.getTime())) return null;
  return { questId, start };
}

export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

/** Активный холд или оплата блокирует слот. */
export function isBookingBlocking(
  status: string,
  expiresAt: Date | null | undefined,
  now: Date = new Date()
): boolean {
  if (status === "PAID") return true;
  if (status === "PENDING") {
    if (!expiresAt) return true; // старые записи без TTL — считаем активными до чистки
    return expiresAt.getTime() > now.getTime();
  }
  return false;
}

/** Для UI: просроченный PENDING показываем как отменённый, без UPDATE в БД. */
export function resolveBookingStatus(
  status: string,
  expiresAt: Date | null | undefined,
  now: Date = new Date()
): "PENDING" | "PAID" | "CANCELLED" | string {
  if (status === "PENDING" && expiresAt && expiresAt.getTime() <= now.getTime()) {
    return "CANCELLED";
  }
  return status;
}
