"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";

import { getUnreadCount } from "@/app/actions/chat";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  iconOnly?: boolean;
};

export function AdminMessagesLink({ iconOnly = false }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const tick = async () => {
      const result = await getUnreadCount();
      setCount(result.count);
    };
    const timer = setTimeout(() => void tick(), 0);
    const id = setInterval(() => void tick(), 10000);
    return () => {
      clearTimeout(timer);
      clearInterval(id);
    };
  }, []);

  return (
    <Link
      href="/admin/messages"
      className={cn(
        buttonVariants({
          variant: "ghost",
          size: iconOnly ? "icon" : "default",
          className: iconOnly ? "relative" : "justify-between",
        }),
      )}
      aria-label="Сообщения"
    >
      <span className="inline-flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        {!iconOnly ? "Сообщения" : null}
      </span>
      {count > 0 ? (
        iconOnly ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {count > 99 ? "99+" : count}
          </span>
        ) : (
          <Badge variant="destructive">{count}</Badge>
        )
      ) : null}
    </Link>
  );
}

