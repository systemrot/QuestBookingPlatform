"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { completeMockPayment } from "@/app/actions/booking";
import { startBookingPayment } from "@/app/actions/payment";
import { Button } from "@/components/ui/button";

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

    const pending = await startBookingPayment(bookingId);
    if ("error" in pending && pending.error) {
      toast.error(pending.error);
      setLoading(false);
      return;
    }

    if ("redirectUrl" in pending) {
      window.location.assign(pending.redirectUrl);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const done = await completeMockPayment(bookingId);
    if ("error" in done && done.error) {
      toast.error("Ошибка оплаты");
      setLoading(false);
      return;
    }

    toast.success("Оплата прошла успешно!");
    setLoading(false);
    router.refresh();
  };

  return (
    <Button size="sm" onClick={onPay} disabled={disabled || loading}>
      {loading ? "Подождите..." : "Оплатить"}
    </Button>
  );
}

