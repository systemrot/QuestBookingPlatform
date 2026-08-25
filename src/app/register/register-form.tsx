"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

import { registerUser, type RegisterState } from "@/app/actions/register";
import { YandexSignInButton } from "@/components/auth/yandex-sign-in-button";
import {
  clampEmailInput,
  clampNameInput,
  clampPasswordInput,
  FIELD_LIMITS,
} from "@/lib/field-limits";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { RuPhoneInput } from "@/components/ui/ru-phone-input";
import { Label } from "@/components/ui/label";

const initial: RegisterState = {};

type Props = {
  yandexOAuthEnabled?: boolean;
};

export function RegisterForm({ yandexOAuthEnabled = false }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState(registerUser, initial);

  if (state?.success) {
    return (
      <div className="space-y-4 rounded-xl border border-border/80 bg-card/40 p-6 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">Аккаунт создан. Теперь можно войти.</p>
        <Link href="/login" className={cn(buttonVariants({ className: "w-full" }))}>
          Перейти ко входу
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {yandexOAuthEnabled ? <YandexSignInButton callbackUrl="/" /> : null}
      {yandexOAuthEnabled ? (
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/80" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">или email</span>
        </div>
      </div>
      ) : null}
    <form action={formAction} className="space-y-4 rounded-xl border border-border/80 bg-card/40 p-6 shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="name">Имя</Label>
        <Input
          id="name"
          name="name"
          required
          autoComplete="name"
          value={name}
          maxLength={FIELD_LIMITS.name.max}
          onChange={(e) => setName(clampNameInput(e.target.value))}
          placeholder="Ваше имя"
        />
        {state?.fieldErrors?.name?.[0] && (
          <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Электронная почта</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          maxLength={FIELD_LIMITS.email.max}
          onChange={(e) => setEmail(clampEmailInput(e.target.value))}
          placeholder="ivan@example.com"
        />
        {state?.fieldErrors?.email?.[0] && (
          <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            value={password}
            minLength={FIELD_LIMITS.password.min}
            maxLength={FIELD_LIMITS.password.max}
            onChange={(e) => setPassword(clampPasswordInput(e.target.value))}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-1.5 top-1/2 inline-flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {state?.fieldErrors?.password?.[0] && (
          <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Телефон (необязательно)</Label>
        <RuPhoneInput id="phone" />
        {state?.fieldErrors?.phone?.[0] && (
          <p className="text-xs text-destructive">{state.fieldErrors.phone[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="age">Возраст (необязательно)</Label>
        <Input id="age" name="age" type="number" min={1} max={120} />
        {state?.fieldErrors?.age?.[0] && (
          <p className="text-xs text-destructive">{state.fieldErrors.age[0]}</p>
        )}
      </div>
      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Создаем..." : "Создать аккаунт"}
      </Button>
    </form>
    </div>
  );
}
