import Link from "next/link";

import { RegisterForm } from "./register-form";

const yandexOAuthEnabled =
  Boolean(process.env.AUTH_YANDEX_ID) && Boolean(process.env.AUTH_YANDEX_SECRET);

export default function RegisterPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <div className="mb-8 space-y-2 text-center">
        <h1 className="font-heading text-2xl font-semibold">Регистрация</h1>
        <p className="text-sm text-muted-foreground">
          Создайте аккаунт, чтобы просматривать доступные слоты и бронировать квесты.
        </p>
      </div>
      <RegisterForm yandexOAuthEnabled={yandexOAuthEnabled} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Уже зарегистрированы?{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Войти
        </Link>
      </p>
    </main>
  );
}
