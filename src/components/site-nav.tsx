"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { Menu } from "lucide-react";
import * as React from "react";
import type { ReactNode } from "react";

import { BloodBrushDrips } from "@/components/blood-brush-drips";
import { MobileTopSheet } from "@/components/mobile-top-sheet";
import { buttonVariants } from "@/components/ui/button-variants";
import { SignOutButton } from "@/components/sign-out-button";
import { isStaff } from "@/lib/roles";
import { cn } from "@/lib/utils";

type SessionUser = {
  role: "USER" | "ADMIN" | "OWNER";
  name?: string | null;
  email?: string | null;
};

function getUserInitials(name?: string | null, email?: string | null): string {
  const n = name?.trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toLocaleUpperCase("ru-RU");
    }
    return parts[0]!.slice(0, 2).toLocaleUpperCase("ru-RU");
  }
  const local = email?.trim().split("@")[0];
  if (local) return local.slice(0, 1).toLocaleUpperCase("ru-RU");
  return "?";
}

/** Stable muted accent for the avatar disc. */
function avatarTone(seed: string): string {
  const tones = [
    "bg-[#5c1a1a] text-white",
    "bg-[#3d2424] text-white",
    "bg-[#4a1f2e] text-white",
    "bg-[#2a2a2a] text-white",
    "bg-[#1f3a2f] text-white",
    "bg-[#2c2a4a] text-white",
  ] as const;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return tones[Math.abs(h) % tones.length]!;
}

function NavLink({
  href,
  children,
  short,
  variant = "ghost",
  prefetch,
  className,
  onClick,
}: {
  href: string;
  children: ReactNode;
  /** Короткая подпись на узких экранах */
  short?: string;
  variant?: "ghost" | "default";
  prefetch?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      onClick={onClick}
      className={cn(buttonVariants({ variant, size: "sm" }), "shrink-0", className)}
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

const menuToggleClass = cn(
  "inline-flex size-14 shrink-0 items-center justify-center rounded-md",
  "text-white/90 transition-colors hover:bg-white/10 hover:text-white",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blood/60"
);

const sheetItemClass = cn(
  buttonVariants({ variant: "ghost", size: "sm" }),
  "h-12 w-full justify-start px-3 text-base font-medium text-white hover:bg-white/10 hover:text-white"
);

/** Guest auth: desktop inline, mobile top sheet. */
function GuestNav() {
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <div className="hidden items-center gap-2 lg:flex">
        <NavLink href="/login" prefetch>
          Войти
        </NavLink>
        <Link
          href="/register"
          prefetch
          className="btn-blood-brush btn-blood-brush--register shrink-0"
        >
          <BloodBrushDrips variant="register" />
          <NavLinkLabel>Регистрация</NavLinkLabel>
        </Link>
      </div>

      <div className="lg:hidden">
        <button
          type="button"
          aria-label="Открыть меню"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className={menuToggleClass}
        >
          <Menu className="size-7" aria-hidden />
        </button>

        <MobileTopSheet
          open={open}
          onOpenChange={setOpen}
          title="Меню"
          description="Вход и регистрация"
        >
          <Link
            href="/login"
            prefetch
            onClick={close}
            className={sheetItemClass}
          >
            Войти
          </Link>
          <Link
            href="/register"
            prefetch
            onClick={close}
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "h-12 w-full justify-center rounded-lg px-3 text-base font-semibold"
            )}
          >
            Регистрация
          </Link>
        </MobileTopSheet>
      </div>
    </>
  );
}

/** Signed-in auth: desktop inline, mobile avatar → top sheet. */
function AuthNav({ user }: { user: SessionUser }) {
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);
  const initials = getUserInitials(user.name, user.email);
  const tone = avatarTone(user.email || user.name || initials);
  const labelName = user.name?.trim() || user.email || "аккаунт";

  return (
    <>
      <div className="hidden items-center gap-2 lg:flex">
        {user.role === "USER" && (
          <>
            <NavLink href="/bookings">Мои бронирования</NavLink>
            <NavLink href="/profile">Профиль</NavLink>
          </>
        )}
        {isStaff(user.role) && <NavLink href="/admin">Админка</NavLink>}
        <span className="hidden max-w-[10rem] truncate text-xs text-muted-foreground xl:inline">
          {user.name ?? user.email}
        </span>
        <SignOutButton />
      </div>

      <div className="lg:hidden">
        <button
          type="button"
          aria-label={`Меню аккаунта — ${labelName}`}
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex size-11 shrink-0 items-center justify-center rounded-full",
            "transition-opacity hover:opacity-90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blood/60"
          )}
        >
          <span
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-full",
              "ring-1 ring-white/20 text-[0.65rem] font-semibold tracking-wide",
              tone
            )}
            aria-hidden
          >
            {initials}
          </span>
        </button>

        <MobileTopSheet
          open={open}
          onOpenChange={setOpen}
          title={labelName}
          description="Бронирования, профиль и выход"
        >
          {user.role === "USER" && (
            <>
              <Link href="/bookings" onClick={close} className={sheetItemClass}>
                Мои бронирования
              </Link>
              <Link href="/profile" onClick={close} className={sheetItemClass}>
                Профиль
              </Link>
            </>
          )}
          {isStaff(user.role) && (
            <Link href="/admin" onClick={close} className={sheetItemClass}>
              Админка
            </Link>
          )}
          <SignOutButton
            outline={false}
            className="h-12 w-full justify-start px-3 text-base font-medium text-white hover:bg-white/10 hover:text-white"
          />
        </MobileTopSheet>
      </div>
    </>
  );
}

export function SiteNav({ session }: { session: { user: SessionUser } | null }) {
  return (
    <nav className="flex shrink-0 items-center gap-0.5 sm:gap-2">
      {session?.user ? <AuthNav user={session.user} /> : <GuestNav />}
    </nav>
  );
}
