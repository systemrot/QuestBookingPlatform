import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "./login-form";

const oauth = {
  yandex:
    Boolean(process.env.AUTH_YANDEX_ID) && Boolean(process.env.AUTH_YANDEX_SECRET),
  google:
    Boolean(process.env.AUTH_GOOGLE_ID) && Boolean(process.env.AUTH_GOOGLE_SECRET),
  vk: Boolean(process.env.AUTH_VK_ID) && Boolean(process.env.AUTH_VK_SECRET),
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <div className="mb-8 space-y-2 text-center">
        <h1 className="font-heading text-2xl font-semibold">Вход</h1>
        <p className="text-sm text-muted-foreground">
          Пользовательские аккаунты бронируют квесты. Администраторы входят через эту же форму.
        </p>
      </div>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted/40" />}>
        <LoginForm oauth={oauth} />
      </Suspense>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Нет аккаунта?{" "}
        <Link href="/register" className="text-primary underline-offset-4 hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </main>
  );
}
