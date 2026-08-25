"use client";

import { signInWithYandexAction } from "@/app/actions/oauth";
import { Button } from "@/components/ui/button";

type Props = {
  callbackUrl: string;
};

export function YandexSignInButton({ callbackUrl }: Props) {
  return (
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
  );
}
