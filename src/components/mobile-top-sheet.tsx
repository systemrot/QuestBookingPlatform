"use client";

import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

/** Full-width sheet from the top + dimmed/blurred backdrop (mobile chrome). */
export function MobileTopSheet({
  open,
  onOpenChange,
  title,
  description = "Закройте панель, чтобы вернуться к странице.",
  children,
  className,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "top-0 right-0 left-0 max-h-[min(85dvh,720px)] w-full max-w-none translate-x-0 translate-y-0",
          "gap-3 overflow-y-auto overscroll-contain rounded-t-none rounded-b-2xl",
          "border-0 bg-black/94 p-4 text-white ring-1 ring-white/12",
          "supports-backdrop-filter:bg-black/88 supports-backdrop-filter:backdrop-blur-md",
          "data-open:slide-in-from-top-3 data-open:zoom-in-100",
          "data-closed:slide-out-to-top-2 data-closed:zoom-out-100",
          "sm:max-w-none",
          "[&_[data-slot=dialog-close]]:text-white/80 [&_[data-slot=dialog-close]]:hover:bg-white/10 [&_[data-slot=dialog-close]]:hover:text-white",
          className
        )}
      >
        <DialogHeader className="pr-8">
          <DialogTitle className="font-heading text-lg text-white">{title}</DialogTitle>
          <DialogDescription className="sr-only">{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
