"use server";

import { signIn } from "@/auth";
import { safeCallbackUrl } from "@/lib/field-limits";

export async function signInWithYandexAction(formData: FormData) {
  const callbackUrl = safeCallbackUrl(String(formData.get("callbackUrl") ?? "/"));
  await signIn("yandex", { redirectTo: callbackUrl });
}

export async function signInWithGoogleAction(formData: FormData) {
  const callbackUrl = safeCallbackUrl(String(formData.get("callbackUrl") ?? "/"));
  await signIn("google", { redirectTo: callbackUrl });
}

export async function signInWithVkAction(formData: FormData) {
  const callbackUrl = safeCallbackUrl(String(formData.get("callbackUrl") ?? "/"));
  await signIn("vk", { redirectTo: callbackUrl });
}
