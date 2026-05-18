import { z } from "zod";

/** Shared max lengths for client `maxLength` and server Zod validation. */
export const FIELD_LIMITS = {
  name: { min: 1, max: 120 },
  email: { max: 254 },
  password: { min: 8, max: 128 },
  chatMessage: { min: 1, max: 1000 },
  callbackUrl: { max: 500 },
} as const;

const noNewlines = (label: string) =>
  z.string().refine((value) => !/[\r\n]/.test(value), {
    message: `${label} не может содержать переносы строк`,
  });

export const nameField = z
  .string()
  .trim()
  .pipe(
    noNewlines("Имя").pipe(
      z
        .string()
        .min(FIELD_LIMITS.name.min, "Укажите имя")
        .max(FIELD_LIMITS.name.max, `Имя не длиннее ${FIELD_LIMITS.name.max} символов`),
    ),
  );

export const emailField = z
  .string()
  .trim()
  .pipe(
    noNewlines("Email").pipe(
      z
        .string()
        .max(FIELD_LIMITS.email.max, `Email не длиннее ${FIELD_LIMITS.email.max} символов`)
        .email("Некорректный email"),
    ),
  );

export const passwordField = z
  .string()
  .pipe(
    noNewlines("Пароль").pipe(
      z
        .string()
        .min(FIELD_LIMITS.password.min, `Минимум ${FIELD_LIMITS.password.min} символов`)
        .max(
          FIELD_LIMITS.password.max,
          `Пароль не длиннее ${FIELD_LIMITS.password.max} символов`,
        ),
    ),
  );

/** Login: only upper bound and no newlines (no minimum length check). */
export const loginPasswordField = z
  .string()
  .pipe(
    noNewlines("Пароль").pipe(
      z
        .string()
        .min(1, "Введите пароль")
        .max(
          FIELD_LIMITS.password.max,
          `Пароль не длиннее ${FIELD_LIMITS.password.max} символов`,
        ),
    ),
  );

export const chatMessageField = z
  .string()
  .trim()
  .pipe(
    noNewlines("Сообщение").pipe(
      z
        .string()
        .min(FIELD_LIMITS.chatMessage.min, "Введите сообщение.")
        .max(
          FIELD_LIMITS.chatMessage.max,
          `Сообщение не длиннее ${FIELD_LIMITS.chatMessage.max} символов`,
        ),
    ),
  );

export function clampChatMessageInput(value: string): string {
  return value.replace(/\r\n|\r|\n/g, " ").slice(0, FIELD_LIMITS.chatMessage.max);
}

export function clampNameInput(value: string): string {
  return value.replace(/\r\n|\r|\n/g, " ").slice(0, FIELD_LIMITS.name.max);
}

export function clampEmailInput(value: string): string {
  return value.replace(/[\r\n]/g, "").slice(0, FIELD_LIMITS.email.max);
}

export function clampPasswordInput(value: string): string {
  return value.replace(/[\r\n]/g, "").slice(0, FIELD_LIMITS.password.max);
}

/** Enforces maxLength on the native element (paste, autofill, mobile keyboards). */
export function enforceInputMaxLength(element: HTMLInputElement, maxLength: number) {
  if (element.value.length <= maxLength) return;
  element.value = element.value.slice(0, maxLength);
}

export function safeCallbackUrl(url: string): string {
  const trimmed = url.trim().slice(0, FIELD_LIMITS.callbackUrl.max);
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/";
  return trimmed;
}

export function parseChatMessage(text: string) {
  return chatMessageField.safeParse(text);
}
