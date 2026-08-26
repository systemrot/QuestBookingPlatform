"use client";

import {
  signInWithGoogleAction,
  signInWithVkAction,
  signInWithYandexAction,
} from "@/app/actions/oauth";
import { Button } from "@/components/ui/button";

export type OAuthProvidersEnabled = {
  yandex?: boolean;
  google?: boolean;
  vk?: boolean;
};

type Props = {
  callbackUrl: string;
  providers: OAuthProvidersEnabled;
};

function GoogleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4 shrink-0">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function VkIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4 shrink-0 fill-[#0077FF]">
      <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1.01-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.161 4.03 8.033c0-.254.102-.491.524-.491h1.744c.391 0 .541.179.69.593.746 2.162 1.984 4.074 2.491 4.074.186 0 .274-.093.274-.593V9.721c-.056-1.016-.593-1.103-.593-1.465 0-.186.152-.373.391-.373h2.744c.338 0 .457.179.457.559v3.202c0 .338.152.457.254.457.186 0 .338-.119.678-.457 1.044-1.165 1.795-2.965 1.795-2.965.102-.22.271-.491.678-.491h1.744c.508 0 .62.271.508.559-.22.932-2.321 3.981-2.321 3.981-.186.305-.254.44 0 .78.186.254.796.779 1.202 1.253.745.847 1.32 1.558 1.473 2.049.17.49-.085.744-.576.744z" />
    </svg>
  );
}

export function OAuthSignInButtons({ callbackUrl, providers }: Props) {
  const anyEnabled = Boolean(providers.yandex || providers.google || providers.vk);
  if (!anyEnabled) return null;

  return (
    <div className="space-y-2">
      {providers.yandex ? (
        <form action={signInWithYandexAction}>
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <Button type="submit" variant="outline" className="w-full gap-2">
            <span
              aria-hidden
              className="inline-flex size-5 items-center justify-center rounded-full bg-[#fc3f1d] text-xs font-bold text-white"
            >
              Я
            </span>
            Войти с Яндекс ID
          </Button>
        </form>
      ) : null}

      {providers.vk ? (
        <form action={signInWithVkAction}>
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <Button type="submit" variant="outline" className="w-full gap-2">
            <VkIcon />
            Войти через VK ID
          </Button>
        </form>
      ) : null}

      {providers.google ? (
        <form action={signInWithGoogleAction}>
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <Button type="submit" variant="outline" className="w-full gap-2">
            <GoogleIcon />
            Войти через Google
          </Button>
        </form>
      ) : null}
    </div>
  );
}
