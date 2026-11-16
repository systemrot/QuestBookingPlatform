"use client";

import { Minus, Plus } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

type Props = {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  "aria-labelledby"?: string;
  "aria-invalid"?: boolean;
  className?: string;
};

function pluralPeople(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "человек";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "человека";
  }
  return "человек";
}

export function PartySizeStepper({
  value,
  min = 1,
  max,
  onChange,
  "aria-labelledby": ariaLabelledBy,
  "aria-invalid": ariaInvalid,
  className,
}: Props) {
  const clamped = Math.min(max, Math.max(min, value));
  const atMin = clamped <= min;
  const atMax = clamped >= max;

  function set(next: number) {
    onChange(Math.min(max, Math.max(min, next)));
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border border-input px-2 py-1.5 dark:bg-input/30",
        ariaInvalid &&
          "border-destructive ring-3 ring-destructive/20 dark:border-destructive/50 dark:ring-destructive/40",
        className
      )}
    >
      <button
        type="button"
        aria-label="Меньше людей"
        disabled={atMin}
        onClick={() => set(clamped - 1)}
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/50 text-foreground transition-colors",
          "hover:border-foreground/30 hover:bg-foreground/5",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          "disabled:pointer-events-none disabled:opacity-35"
        )}
      >
        <Minus className="size-4" strokeWidth={2.25} aria-hidden />
      </button>

      <div
        className="min-w-0 flex-1 text-center"
        aria-labelledby={ariaLabelledBy}
        aria-live="polite"
        aria-atomic="true"
        aria-invalid={ariaInvalid || undefined}
      >
        <div className="text-2xl font-semibold tabular-nums leading-none tracking-tight text-foreground">
          {clamped}
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          {pluralPeople(clamped)}
        </div>
      </div>

      <button
        type="button"
        aria-label="Больше людей"
        disabled={atMax}
        onClick={() => set(clamped + 1)}
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/50 text-foreground transition-colors",
          "hover:border-foreground/30 hover:bg-foreground/5",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          "disabled:pointer-events-none disabled:opacity-35"
        )}
      >
        <Plus className="size-4" strokeWidth={2.25} aria-hidden />
      </button>
    </div>
  );
}
