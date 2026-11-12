"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { Menu, X } from "lucide-react";
import * as React from "react";
import type { ReactNode } from "react";

import { BloodBrushDrips } from "@/components/blood-brush-drips";
import { buttonVariants } from "@/components/ui/button-variants";
import { SignOutButton } from "@/components/sign-out-button";
import { isStaff } from "@/lib/roles";
import { cn } from "@/lib/utils";

type SessionUser = {
  role: "USER" | "ADMIN" | "OWNER";
  name?: string | null;
  email?: string | null;
};

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

/** Guest auth: desktop inline, mobile hamburger top-right. */
function GuestNav() {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

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

      <div ref={rootRef} className="relative lg:hidden">
        <button
          type="button"
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={open}
          aria-controls="guest-auth-menu"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-md",
            "text-white/90 transition-colors hover:bg-white/10 hover:text-white",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blood/60"
          )}
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>

        {open ? (
          <div
            id="guest-auth-menu"
            role="menu"
            className={cn(
              "absolute right-0 top-[calc(100%+0.4rem)] z-50 w-[min(13.5rem,calc(100vw-1.5rem))]",
              "rounded-xl border border-white/12 bg-black/94 p-2 shadow-[0_18px_40px_rgba(0,0,0,0.65)]",
              "backdrop-blur-md"
            )}
          >
            <div className="flex flex-col gap-1">
              <Link
                href="/login"
                prefetch
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "h-10 w-full justify-center px-3 text-sm font-medium"
                )}
              >
                Войти
              </Link>
              <Link
                href="/register"
                prefetch
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" }),
                  "h-10 w-full justify-center rounded-lg px-3 text-sm font-semibold"
                )}
              >
                Регистрация
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </>
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
          {isStaff(session.user.role) && (
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
        <GuestNav />
      )}
    </nav>
  );
}
