"use server";

import { signIn } from "@/auth";
import { safeCallbackUrl } from "@/lib/field-limits";

export async function signInWithYandexAction(formData: FormData) {
  const callbackUrl = safeCallbackUrl(String(formData.get("callbackUrl") ?? "/"));
  await signIn("yandex", { redirectTo: callbackUrl });
}
