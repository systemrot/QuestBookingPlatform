"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { MessageSquare } from "lucide-react";

import { useAdminUnreadCount } from "@/components/admin/admin-inbox-pulse";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Расписание", match: (p: string) => p === "/admin" },
  {
    href: "/admin/reports",
    label: "Отчёты",
    match: (p: string) => p.startsWith("/admin/reports"),
  },
  {
    href: "/admin/messages",
    label: "Сообщения",
    match: (p: string) => p.startsWith("/admin/messages"),
    messages: true as const,
  },
  { href: "/", label: "На сайт", match: () => false },
] as const;

function PendingDot() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      aria-hidden
      className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-primary"
    />
  );
}

function MessagesBadge() {
  const count = useAdminUnreadCount();
  if (count <= 0) return null;
  return <Badge variant="destructive">{count > 99 ? "99+" : count}</Badge>;
}

function NavItem({
  href,
  label,
  active,
  end,
  className,
}: {
  href: string;
  label: ReactNode;
  active: boolean;
  end?: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        buttonVariants({
          variant: active ? "secondary" : "ghost",
          size: "sm",
          className: "w-full justify-start gap-2",
        }),
        active && "pointer-events-none",
        className
      )}
      aria-current={active ? "page" : undefined}
    >
      <span className="inline-flex min-w-0 flex-1 items-center gap-2">
        {label}
        <PendingDot />
      </span>
      {end}
    </Link>
  );
}

type Props = {
  variant: "sidebar" | "mobile";
};

export function AdminNav({ variant }: Props) {
  const pathname = usePathname();

  if (variant === "mobile") {
    return (
      <nav
        aria-label="Админ-меню"
        className="flex items-center gap-1 overflow-x-auto no-scrollbar rounded-xl border border-border/70 bg-card/40 p-1.5"
      >
        {LINKS.map((item) => {
          const active = item.match(pathname);
          const isMessages = "messages" in item && item.messages;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                buttonVariants({
                  variant: active ? "secondary" : "ghost",
                  size: "sm",
                }),
                "shrink-0 gap-1.5",
                active && "pointer-events-none",
                item.href === "/" && "ml-auto"
              )}
              aria-current={active ? "page" : undefined}
            >
              {isMessages ? <MessageSquare className="size-3.5" /> : null}
              {item.label}
              <PendingDot />
              {isMessages ? <MessagesBadge /> : null}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <aside className="hidden w-56 shrink-0 rounded-xl border border-border/70 bg-card/40 p-3 lg:block">
      <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Панель администратора
      </p>
      <nav className="mt-2 flex flex-col gap-1">
        {LINKS.map((item) => {
          const active = item.match(pathname);
          const isMessages = "messages" in item && item.messages;
          return (
            <NavItem
              key={item.href}
              href={item.href}
              active={active}
              label={
                isMessages ? (
                  <>
                    <MessageSquare className="size-4 shrink-0" />
                    {item.label}
                  </>
                ) : (
                  item.label
                )
              }
              end={isMessages ? <MessagesBadge /> : null}
            />
          );
        })}
      </nav>
    </aside>
  );
}
