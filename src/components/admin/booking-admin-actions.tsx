"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  adminCancelBooking,
  adminExtendHold,
  adminMarkBookingPaid,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  bookingId: string;
  status: string;
};

type Action = "cancel" | "extend" | "paid";

export function BookingAdminActions({ bookingId, status: initialStatus }: Props) {
  const router = useRouter();
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [status, setStatus] = React.useState(initialStatus);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [pending, setPending] = React.useState<Action | null>(null);
  const [menuPos, setMenuPos] = React.useState<{ top: number; left: number } | null>(
    null
  );
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  const updateMenuPos = React.useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const menuWidth = 160;
    const left = Math.min(
      Math.max(8, rect.right - menuWidth),
      window.innerWidth - menuWidth - 8
    );
    setMenuPos({ top: rect.bottom + 4, left });
  }, []);

  React.useEffect(() => {
    if (!menuOpen) return;
    updateMenuPos();
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setMenuOpen(false);
    }
    function onScroll() {
      updateMenuPos();
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [menuOpen, updateMenuPos]);

  async function run(action: Action) {
    if (pending) return;
    setMenuOpen(false);
    setPending(action);

    if (action === "cancel") setStatus("CANCELLED");

    try {
      if (action === "cancel") {
        const res = await adminCancelBooking(bookingId);
        if ("error" in res) {
          setStatus(initialStatus);
          toast.error(res.error);
          return;
        }
        toast.success(res.already ? "Бронь уже снята" : "Бронь снята");
        router.refresh();
        return;
      }

      if (action === "extend") {
        const res = await adminExtendHold(bookingId);
        if ("error" in res) {
          toast.error(res.error);
          return;
        }
        toast.success("Холд продлён на 20 минут");
        router.refresh();
        return;
      }

      const res = await adminMarkBookingPaid(bookingId);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      setStatus("PAID");
      toast.success("Отмечено как оплачено");
      router.refresh();
    } catch {
      if (action === "cancel") setStatus(initialStatus);
      toast.error("Не удалось выполнить действие. Попробуйте ещё раз.");
    } finally {
      setPending(null);
    }
  }

  if (status === "CANCELLED") {
    return (
      <span className="text-xs font-medium text-muted-foreground">Снято</span>
    );
  }

  const busy = pending !== null;

  const menu =
    mounted && menuOpen && !busy && menuPos
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: menuPos.top, left: menuPos.left }}
            className="fixed z-[80] w-40 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-md ring-1 ring-foreground/10"
          >
            {status === "PENDING" ? (
              <>
                <button
                  type="button"
                  role="menuitem"
                  className={cn(
                    "flex w-full items-center rounded-md px-2.5 py-2 text-left text-xs font-medium",
                    "text-amber-200 hover:bg-amber-500/15"
                  )}
                  onClick={() => void run("extend")}
                >
                  Продлить
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={cn(
                    "flex w-full items-center rounded-md px-2.5 py-2 text-left text-xs font-medium",
                    "text-emerald-300 hover:bg-emerald-500/15"
                  )}
                  onClick={() => void run("paid")}
                >
                  Оплачено
                </button>
              </>
            ) : null}
            <button
              type="button"
              role="menuitem"
              className={cn(
                "flex w-full items-center rounded-md px-2.5 py-2 text-left text-xs font-medium",
                "text-red-400 hover:bg-red-500/15"
              )}
              onClick={() => void run("cancel")}
            >
              Снять
            </button>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="relative">
      <Button
        ref={triggerRef}
        type="button"
        size="sm"
        variant="outline"
        className="h-8 gap-1 px-2.5 text-xs"
        disabled={busy}
        aria-expanded={menuOpen}
        onClick={() => {
          if (!menuOpen) updateMenuPos();
          setMenuOpen((v) => !v);
        }}
      >
        {busy ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="size-3.5 animate-spin" />
            Ждём…
          </span>
        ) : (
          <>
            Действия
            <ChevronDown className="size-3.5 opacity-70" />
          </>
        )}
      </Button>
      {menu}
    </div>
  );
}
