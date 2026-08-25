import type { OAuthConfig } from "next-auth/providers";

export type YandexProfile = {
  id: string;
  login: string;
  display_name?: string;
  real_name?: string;
  first_name?: string;
  last_name?: string;
  default_email?: string;
  emails?: string[];
  default_phone?: { id: number; number: string };
  default_avatar_id?: string;
  is_avatar_empty?: boolean;
};

function yandexAvatarUrl(profile: YandexProfile): string | null {
  if (profile.is_avatar_empty || !profile.default_avatar_id) return null;
  return `https://avatars.yandex.net/get-yapic/${profile.default_avatar_id}/islands-200`;
}

export function Yandex({
  clientId,
  clientSecret,
}: {
  clientId: string;
  clientSecret: string;
}): OAuthConfig<YandexProfile> {
  return {
    id: "yandex",
    name: "Yandex",
    type: "oauth",
    clientId,
    clientSecret,
    authorization: {
      url: "https://oauth.yandex.ru/authorize",
      params: {
        scope: "login:info login:email login:avatar login:default_phone",
      },
    },
    token: "https://oauth.yandex.ru/token",
    userinfo: {
      url: "https://login.yandex.ru/info?format=json",
      async request({ tokens }: { tokens: { access_token?: string } }) {
        const accessToken = tokens.access_token;
        if (!accessToken) {
          throw new Error("Yandex OAuth response has no access token");
        }
        const response = await fetch("https://login.yandex.ru/info?format=json", {
          headers: { Authorization: `OAuth ${accessToken}` },
        });
        if (!response.ok) {
          throw new Error(`Yandex userinfo failed: ${response.status}`);
        }
        return (await response.json()) as YandexProfile;
      },
    },
    profile(profile) {
      const email = profile.default_email ?? profile.emails?.[0] ?? null;

      const name =
        profile.real_name?.trim() ||
        profile.display_name?.trim() ||
        [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
        profile.login;

      return {
        id: String(profile.id),
        name,
        email,
        image: yandexAvatarUrl(profile),
      };
    },
  };
}
