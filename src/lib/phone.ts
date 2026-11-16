/** Нормализация RU-телефона к виду +7XXXXXXXXXX или null. */
export function normalizeRuPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  let normalized = digits;
  if (normalized.length === 11 && (normalized.startsWith("8") || normalized.startsWith("7"))) {
    normalized = `7${normalized.slice(1)}`;
  } else if (normalized.length === 10 && normalized.startsWith("9")) {
    normalized = `7${normalized}`;
  } else {
    return null;
  }

  if (!/^7\d{10}$/.test(normalized)) return null;
  return `+${normalized}`;
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("7")) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }
  return phone;
}
