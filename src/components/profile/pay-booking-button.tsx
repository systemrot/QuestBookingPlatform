"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { startBookingPayment } from "@/app/actions/payment";
import { Button } from "@/components/ui/button";
import { clearClientPendingHold } from "@/lib/pending-hold-client";

type Props = {
  bookingId: string;
  disabled?: boolean;
};

export function PayBookingButton({ bookingId, disabled }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onPay = async () => {
    if (disabled || loading) return;
    setLoading(true);

    try {
      const result = await startBookingPayment(bookingId);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      if ("redirectUrl" in result) {
        window.location.assign(result.redirectUrl);
        return;
      }

      clearClientPendingHold();
      toast.success("Оплата прошла успешно!");
      router.refresh();
    } catch {
      toast.error("Нет связи с сервером. Попробуйте ещё раз через пару секунд.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="sm" onClick={onPay} disabled={disabled || loading}>
      {loading ? (
        <span className="inline-flex items-center gap-1.5">
          <Loader2 className="size-3.5 animate-spin" />
          Оплачиваем…
        </span>
      ) : (
        "Оплатить"
      )}
    </Button>
  );
}
