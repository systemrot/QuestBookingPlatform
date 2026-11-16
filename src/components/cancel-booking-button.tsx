"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cancelBookingRequest } from "@/app/actions/booking";
import { Button } from "@/components/ui/button";

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function onCancel() {
    if (pending) return;
    const ok = window.confirm(
      "Отменить заявку? Менеджер получит уведомление об отмене."
    );
    if (!ok) return;

    setPending(true);
    try {
      const res = await cancelBookingRequest(bookingId);
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Заявка отменена");
      router.refresh();
    } catch {
      toast.error("Не удалось отменить. Попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => void onCancel()}
    >
      {pending ? "Отмена…" : "Отменить заявку"}
    </Button>
  );
}
