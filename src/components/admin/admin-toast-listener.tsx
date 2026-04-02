"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { getUnreadNotifications } from "@/app/actions/chat";

export function AdminToastListener() {
  const router = useRouter();
  const pathname = usePathname();
  const initializedRef = useRef(false);
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const tick = async () => {
      const notifications = await getUnreadNotifications();
      const ids = new Set(notifications.map((n) => n.id));

      if (!initializedRef.current) {
        ids.forEach((id) => seenIdsRef.current.add(id));
        initializedRef.current = true;
        return;
      }

      for (const item of notifications) {
        if (seenIdsRef.current.has(item.id)) continue;
        seenIdsRef.current.add(item.id);

        if (pathname.startsWith("/admin/messages")) {
          continue;
        }

        toast("Новое сообщение", {
          description: `Новое сообщение от ${item.userName}: ${item.textSnippet}`,
          action: {
            label: "Открыть",
            onClick: () => router.push(`/admin/messages?userId=${item.userId}`),
          },
        });
      }

      // keep only IDs that still exist in unread pool
      seenIdsRef.current.forEach((id) => {
        if (!ids.has(id)) {
          seenIdsRef.current.delete(id);
        }
      });
    };

    const timer = setTimeout(() => void tick(), 0);
    const id = setInterval(() => void tick(), 10000);
    return () => {
      clearTimeout(timer);
      clearInterval(id);
    };
  }, [router, pathname]);

  return null;
}

