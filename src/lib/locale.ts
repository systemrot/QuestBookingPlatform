import { format } from "date-fns";
import { ru } from "date-fns/locale";

export const ruLocale = ru;

export function formatRu(date: Date, pattern: string) {
  return format(date, pattern, { locale: ruLocale });
}

export function formatRub(value: number | string) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

