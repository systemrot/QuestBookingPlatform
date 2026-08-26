"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

import { loginAction, type LoginState } from "@/app/actions/login";
import {
  clampEmailInput,
  clampPasswordInput,
  FIELD_LIMITS,
  safeCallbackUrl,
} from "@/lib/field-limits";
import {
  OAuthSignInButtons,
  type OAuthProvidersEnabled,
} from "@/components/auth/oauth-sign-in-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: LoginState = {};

type Props = {
  oauth: OAuthProvidersEnabled;
};

export function LoginForm({ oauth }: Props) {
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl") ?? "/");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [state, formAction, pending] = useActionState(loginAction, initial);
  const anyOAuth = Boolean(oauth.yandex || oauth.google || oauth.vk);

  return (
    <div className="space-y-4">
      <OAuthSignInButtons callbackUrl={callbackUrl} providers={oauth} />
      {anyOAuth ? (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/80" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">или email</span>
          </div>
        </div>
      ) : null}
      <form
        action={formAction}
        className="space-y-4 rounded-xl border border-border/80 bg-card/40 p-6 shadow-sm"
      >
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div className="space-y-2">
          <Label htmlFor="email">Электронная почта</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
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
              autoComplete="current-password"
              required
              value={password}
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
        {state?.error && (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Входим..." : "Войти"}
        </Button>
      </form>
    </div>
  );
}
