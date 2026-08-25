import type { YandexProfile } from "@/auth/providers/yandex";

export function resolveYandexEmail(
  user: { email?: string | null },
  profile?: YandexProfile | null
): string | null {
  const direct =
    user.email?.trim().toLowerCase() ??
    profile?.default_email?.trim().toLowerCase() ??
    profile?.emails?.[0]?.trim().toLowerCase();

  if (direct) return direct;

  const login = profile?.login?.trim();
  if (!login) return null;
  if (login.includes("@")) return login.toLowerCase();
  return `${login.toLowerCase()}@yandex.ru`;
}
