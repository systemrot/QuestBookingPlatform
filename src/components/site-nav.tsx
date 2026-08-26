"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button-variants";
import { SignOutButton } from "@/components/sign-out-button";
import { cn } from "@/lib/utils";

type SessionUser = {
  role: "USER" | "ADMIN";
  name?: string | null;
  email?: string | null;
};

function NavLink({
  href,
  children,
  short,
  variant = "ghost",
  prefetch,
}: {
  href: string;
  children: ReactNode;
  /** Короткая подпись на узких экранах */
  short?: string;
  variant?: "ghost" | "default";
  prefetch?: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={cn(buttonVariants({ variant, size: "sm" }), "shrink-0")}
    >
      <NavLinkLabel short={short}>{children}</NavLinkLabel>
    </Link>
  );
}

function NavLinkLabel({
  children,
  short,
}: {
  children: ReactNode;
  short?: string;
}) {
  const { pending } = useLinkStatus();

  return (
    <span className={cn("inline-flex items-center gap-1.5", pending && "opacity-70")}>
      {short ? (
        <>
          <span className="sm:hidden">{short}</span>
          <span className="hidden sm:inline">{children}</span>
        </>
      ) : (
        children
      )}
      {pending ? (
        <span
          aria-hidden
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary"
        />
      ) : null}
    </span>
  );
}

export function SiteNav({ session }: { session: { user: SessionUser } | null }) {
  return (
    <nav className="flex shrink-0 items-center gap-0.5 sm:gap-2">
      {session?.user ? (
        <>
          {session.user.role === "USER" && (
            <>
              <NavLink href="/bookings" short="Брони">
                Мои бронирования
              </NavLink>
              <NavLink href="/profile" short="Профиль">
                Профиль
              </NavLink>
            </>
          )}
          {session.user.role === "ADMIN" && (
            <NavLink href="/admin" short="Админ">
              Админка
            </NavLink>
          )}
          <span className="hidden max-w-[10rem] truncate text-xs text-muted-foreground md:inline">
            {session.user.name ?? session.user.email}
          </span>
          <SignOutButton />
        </>
      ) : (
        <>
          {/* prefetch: в dev первый заход иначе 1–3с на Compiling /login|/register */}
          <NavLink href="/login" prefetch>
            Войти
          </NavLink>
          <Link
            href="/register"
            prefetch
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "shrink-0 px-2 text-xs sm:px-3 sm:text-sm"
            )}
          >
            <NavLinkLabel>Регистрация</NavLinkLabel>
          </Link>
        </>
      )}
    </nav>
  );
}
