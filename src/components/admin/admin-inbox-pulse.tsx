"use client";

/**
 * Единый опрос входящих для бейджа и тостов — один POST /admin, не пара.
 */
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  getAdminInboxPulse,
  type UnreadNotification,
} from "@/app/actions/chat";

type Pulse = { count: number; notifications: UnreadNotification[] };
type Router = ReturnType<typeof useRouter>;

let pollers = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
let interval: ReturnType<typeof setInterval> | null = null;
let cached: Pulse = { count: 0, notifications: [] };
const listeners = new Set<(p: Pulse) => void>();
const seenIds = new Set<string>();
let seeded = false;
let latestPathname = "";
let latestRouter: Router | null = null;

async function tick() {
  try {
    const pulse = await getAdminInboxPulse();
    cached = pulse;
    listeners.forEach((l) => l(cached));

    const ids = new Set(pulse.notifications.map((n) => n.id));
    if (!seeded) {
      ids.forEach((id) => seenIds.add(id));
      seeded = true;
      return;
    }

    const pathname = latestPathname;
    const router = latestRouter;
    if (!router) return;

    for (const item of pulse.notifications) {
      if (seenIds.has(item.id)) continue;
      seenIds.add(item.id);
      if (pathname.startsWith("/admin/messages")) continue;
      toast("Новое сообщение", {
        description: `Новое сообщение от ${item.userName}: ${item.textSnippet}`,
        action: {
          label: "Открыть",
          onClick: () => router.push(`/admin/messages?userId=${item.userId}`),
        },
      });
    }

    seenIds.forEach((id) => {
      if (!ids.has(id)) seenIds.delete(id);
    });
  } catch {
    // never break admin UI
  }
}

function subscribe(listener: (p: Pulse) => void) {
  listeners.add(listener);
  listener(cached);
  pollers += 1;

  if (pollers === 1) {
    const run = () => void tick();
    // Не дёргать БД сразу при открытии админки — иначе мешает сохранению актёров.
    timer = setTimeout(run, 45_000);
    interval = setInterval(run, 120_000);
  }

  return () => {
    listeners.delete(listener);
    pollers = Math.max(0, pollers - 1);
    if (pollers === 0) {
      if (timer) clearTimeout(timer);
      if (interval) clearInterval(interval);
      timer = null;
      interval = null;
    }
  };
}

export function useAdminUnreadCount() {
  const pathname = usePathname();
  const router = useRouter();
  const [count, setCount] = useState(0);

  useEffect(() => {
    latestPathname = pathname;
    latestRouter = router;
  }, [pathname, router]);

  useEffect(() => {
    return subscribe((p) => setCount(p.count));
  }, []);

  return count;
}

/** Mount once in admin layout — drives toasts via shared poller. */
export function AdminToastListener() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    latestPathname = pathname;
    latestRouter = router;
  }, [pathname, router]);

  useEffect(() => {
    return subscribe(() => undefined);
  }, []);

  return null;
}
