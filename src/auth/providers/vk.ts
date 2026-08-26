import type { OAuthConfig } from "next-auth/providers";

const API_VERSION = "5.131";

export type VkProfile = {
  id: number | string;
  first_name?: string;
  last_name?: string;
  photo_100?: string;
  email?: string | null;
};

/** Стабильный email, если VK не отдал почту (часто без подтверждённого email в профиле). */
export function resolveVkEmail(
  user: { email?: string | null },
  profile?: VkProfile | null
): string | null {
  const direct = user.email?.trim().toLowerCase() || profile?.email?.trim().toLowerCase();
  if (direct) return direct;
  const id = profile?.id != null ? String(profile.id) : null;
  if (!id) return null;
  return `vk_${id}@users.vk`;
}

/**
 * VK OAuth для Auth.js: без PKCE (VK его не принимает для server-side),
 * email приходит в token response, userinfo — через api.vk.com.
 */
export function Vk({
  clientId,
  clientSecret,
}: {
  clientId: string;
  clientSecret: string;
}): OAuthConfig<VkProfile> {
  return {
    id: "vk",
    name: "VK",
    type: "oauth",
    clientId,
    clientSecret,
    checks: ["state"],
    client: {
      token_endpoint_auth_method: "client_secret_post",
    },
    authorization: {
      url: "https://oauth.vk.com/authorize",
      params: {
        scope: "email",
        v: API_VERSION,
        response_type: "code",
      },
    },
    token: {
      url: `https://oauth.vk.com/access_token?v=${API_VERSION}`,
      async conform(response: Response) {
        const data = (await response.json()) as Record<string, unknown>;
        return new Response(
          JSON.stringify({
            ...data,
            token_type: data.token_type ?? "bearer",
          }),
          {
            status: response.status,
            statusText: response.statusText,
            headers: { "Content-Type": "application/json" },
          }
        );
      },
    },
    userinfo: {
      url: `https://api.vk.com/method/users.get?fields=photo_100&v=${API_VERSION}`,
      async request({
        tokens,
      }: {
        tokens: { access_token?: string; email?: string };
      }) {
        const accessToken = tokens.access_token;
        if (!accessToken) {
          throw new Error("VK OAuth response has no access token");
        }
        const url = new URL("https://api.vk.com/method/users.get");
        url.searchParams.set("fields", "photo_100");
        url.searchParams.set("v", API_VERSION);
        url.searchParams.set("access_token", accessToken);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`VK userinfo failed: ${response.status}`);
        }
        const data = (await response.json()) as {
          response?: VkProfile[];
          error?: { error_msg?: string };
        };
        const profile = data.response?.[0];
        if (!profile) {
          throw new Error(data.error?.error_msg ?? "VK userinfo empty");
        }
        return {
          ...profile,
          email: tokens.email ?? profile.email ?? null,
        };
      },
    },
    profile(profile) {
      const name =
        [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
        `VK ${profile.id}`;
      return {
        id: String(profile.id),
        name,
        email: resolveVkEmail({}, profile),
        image: profile.photo_100 ?? null,
      };
    },
  };
}
