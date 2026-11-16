"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ChartColumn,
  Clapperboard,
  Drama,
  Info,
  Lightbulb,
  MessageSquare,
  UsersRound,
} from "lucide-react";

import { useAdminUnreadCount } from "@/components/admin/admin-inbox-pulse";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import type { AppRole } from "@/lib/roles";
import { isOwner } from "@/lib/roles";
import { cn } from "@/lib/utils";

type NavLinkDef = {
  href: string;
  label: string;
  match: (p: string) => boolean;
  icon?: LucideIcon;
  messages?: boolean;
  feedback?: boolean;
  ownerOnly?: boolean;
};

const LINKS: NavLinkDef[] = [
  {
    href: "/admin",
    label: "Расписание",
    match: (p) => p === "/admin",
    icon: CalendarDays,
  },
  {
    href: "/admin/quests",
    label: "Квесты",
    match: (p) => p.startsWith("/admin/quests"),
    icon: Clapperboard,
    ownerOnly: true,
  },
  {
    href: "/admin/actors",
    label: "Актёры",
    match: (p) => p.startsWith("/admin/actors"),
    icon: Drama,
    ownerOnly: true,
  },
  {
    href: "/admin/team",
    label: "Команда",
    match: (p) => p.startsWith("/admin/team"),
    icon: UsersRound,
    ownerOnly: true,
  },
  {
    href: "/admin/reports",
    label: "Отчёты",
    match: (p) => p.startsWith("/admin/reports"),
    icon: ChartColumn,
  },
  {
    href: "/admin/messages",
    label: "Сообщения",
    match: (p) => p.startsWith("/admin/messages"),
    icon: MessageSquare,
    messages: true,
  },
  {
    href: "/admin/help",
    label: "Справка",
    match: (p) => p.startsWith("/admin/help"),
    icon: Info,
  },
  {
    href: "/admin/feedback",
    label: "Идеи",
    match: (p) => p.startsWith("/admin/feedback"),
    icon: Lightbulb,
    feedback: true,
  },
  { href: "/", label: "На сайт", match: () => false },
];

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
  role: AppRole;
};

export function AdminNav({ variant, role }: Props) {
  const pathname = usePathname();
  const links = LINKS.filter((item) => !item.ownerOnly || isOwner(role));

  if (variant === "mobile") {
    return (
      <nav
        aria-label="Админ-меню"
        className="flex items-center gap-1 overflow-x-auto no-scrollbar rounded-xl border border-border/70 bg-card/40 p-1.5"
      >
        {links.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
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
                item.href === "/" && "ml-auto",
                item.feedback &&
                  !active &&
                  "text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
              )}
              aria-current={active ? "page" : undefined}
            >
              {Icon ? <Icon className="size-3.5" /> : null}
              {item.label}
              <PendingDot />
              {item.messages ? <MessagesBadge /> : null}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <aside className="sticky top-20 hidden h-fit w-56 shrink-0 rounded-xl border border-border/70 bg-card/40 p-3 lg:block">
      <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {isOwner(role) ? "Панель владельца" : "Панель администратора"}
      </p>
      <nav className="mt-2 flex flex-col gap-1">
        {links.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <NavItem
              key={item.href}
              href={item.href}
              active={active}
              className={
                item.feedback && !active
                  ? "text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                  : undefined
              }
              label={
                Icon ? (
                  <>
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </>
                ) : (
                  item.label
                )
              }
              end={item.messages ? <MessagesBadge /> : null}
            />
          );
        })}
      </nav>
    </aside>
  );
}
