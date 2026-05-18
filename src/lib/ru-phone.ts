/** Russian mobile: +7 9XX XXX-XX-XX (11 digits, starts with 79). */

export const RU_PHONE_MASK_PLACEHOLDER = "+7 (999) 123-45-67";
export const RU_PHONE_MASK_MAX_LENGTH = 18;

export function extractRuPhoneDigits(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("8")) {
    digits = `7${digits.slice(1)}`;
  } else if (digits.length > 0 && !digits.startsWith("7")) {
    digits = `7${digits}`;
  }
  return digits.slice(0, 11);
}

export function isCompleteRuMobilePhone(digits: string): boolean {
  return digits.length === 11 && digits.startsWith("79");
}

export function formatRuPhoneMask(digitsInput: string): string {
  const d = extractRuPhoneDigits(digitsInput);
  if (d.length === 0) return "";

  const n = d.startsWith("7") ? d.slice(1) : d;
  let out = "+7";
  if (n.length === 0) return `${out} `;

  if (n.length <= 3) {
    return `${out} (${n}`;
  }

  out += ` (${n.slice(0, 3)})`;
  if (n.length <= 6) {
    return `${out} ${n.slice(3)}`;
  }

  out += ` ${n.slice(3, 6)}`;
  if (n.length <= 8) {
    return `${out}-${n.slice(6)}`;
  }

  return `${out}-${n.slice(6, 8)}-${n.slice(8, 10)}`;
}

export function displayRuPhoneFromStored(stored: string | null | undefined): string {
  if (!stored) return "";
  return formatRuPhoneMask(extractRuPhoneDigits(stored));
}

export function toRuPhoneE164(digits: string): string | null {
  const d = extractRuPhoneDigits(digits);
  if (!isCompleteRuMobilePhone(d)) return null;
  return `+${d}`;
}

export type ParseOptionalRuPhoneResult =
  | { ok: true; value: string | null }
  | { ok: false; message: string };

export function parseOptionalRuPhone(raw: string): ParseOptionalRuPhoneResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: true, value: null };
  }

  const digits = extractRuPhoneDigits(trimmed);
  if (digits.length === 0) {
    return { ok: true, value: null };
  }

  if (!isCompleteRuMobilePhone(digits)) {
    return {
      ok: false,
      message: "Укажите полный мобильный номер: +7 (9XX) XXX-XX-XX",
    };
  }

  return { ok: true, value: `+${digits}` };
}
