import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";

const statusConfig = {
  PENDING: { variant: "secondary" as const, label: "Ожидает оплаты" },
  PAID: { variant: "success" as const, label: "Оплачено" },
  CANCELLED: { variant: "outline" as const, label: "Отменено" },
};

type BookingStatus = keyof typeof statusConfig;

export function bookingStatusLabel(status: string) {
  return statusConfig[status as BookingStatus]?.label ?? status;
}

export function BookingStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const config = statusConfig[status as BookingStatus] ?? {
    variant: "secondary" as const,
    label: status,
  };

  return (
    <Badge variant={config.variant} className={className}>
      {status === "PAID" ? <Check aria-hidden /> : null}
      {config.label}
    </Badge>
  );
}
