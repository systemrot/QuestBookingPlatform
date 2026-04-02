"use client";

import { useActionState } from "react";
import Link from "next/link";

import { registerUser, type RegisterState } from "@/app/actions/register";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: RegisterState = {};

export function RegisterForm() {
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
    <form action={formAction} className="space-y-4 rounded-xl border border-border/80 bg-card/40 p-6 shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="name">Имя</Label>
        <Input id="name" name="name" required autoComplete="name" placeholder="Ваше имя" />
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
          placeholder="ivan@example.com"
        />
        {state?.fieldErrors?.email?.[0] && (
          <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
        />
        {state?.fieldErrors?.password?.[0] && (
          <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Телефон (необязательно)</Label>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" />
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
  );
}
