import Google from "next-auth/providers/google";
import type { OAuthConfig } from "next-auth/providers";
import type { GoogleProfile } from "next-auth/providers/google";

import { fetchWithRetry } from "@/lib/fetch-retry";

type GoogleOpts = {
  clientId: string;
  clientSecret: string;
};

/**
 * Google OAuth with retries on token + userinfo.
 * Selectel RU often times out to oauth2.googleapis.com intermittently;
 * Auth.js then shows a cryptic "Server error".
 */
export function GoogleResilient(options: GoogleOpts): OAuthConfig<GoogleProfile> {
  const base = Google({
    clientId: options.clientId,
    clientSecret: options.clientSecret,
  });

  return {
    ...base,
    token: {
      url: "https://oauth2.googleapis.com/token",
      async request({ params, provider }) {
        const body = new URLSearchParams();
        body.set("grant_type", "authorization_code");
        body.set("code", String(params.code ?? ""));
        body.set("redirect_uri", String(params.redirect_uri ?? ""));
        body.set("client_id", String(provider.clientId ?? options.clientId));
        body.set(
          "client_secret",
          String(provider.clientSecret ?? options.clientSecret)
        );
        if (params.code_verifier) {
          body.set("code_verifier", String(params.code_verifier));
        }

        const res = await fetchWithRetry(
          "https://oauth2.googleapis.com/token",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body,
          },
          { label: "google/token", attempts: 4, timeoutMs: 14_000 }
        );

        const tokens = (await res.json()) as Record<string, unknown>;
        if (!res.ok) {
          console.error("[auth/google] token error", res.status, tokens);
          throw new Error(
            typeof tokens.error === "string" ? tokens.error : "google_token_error"
          );
        }
        return { tokens };
      },
    },
    userinfo: {
      url: "https://openidconnect.googleapis.com/v1/userinfo",
      async request({ tokens }) {
        const accessToken = tokens.access_token;
        if (!accessToken) {
          throw new Error("google_missing_access_token");
        }
        const res = await fetchWithRetry(
          "https://openidconnect.googleapis.com/v1/userinfo",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
          { label: "google/userinfo", attempts: 4, timeoutMs: 14_000 }
        );
        if (!res.ok) {
          throw new Error(`google_userinfo_${res.status}`);
        }
        return (await res.json()) as GoogleProfile;
      },
    },
  };
}
