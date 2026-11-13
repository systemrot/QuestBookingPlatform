"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, MapPin } from "lucide-react";
import { toast } from "sonner";

import { selectCity } from "@/app/actions/city";
import { MobileTopSheet } from "@/components/mobile-top-sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type CityOption = {
  slug: string;
  name: string;
};

type Props = {
  cities: CityOption[];
  currentSlug: string;
  className?: string;
};

export function CityPicker({ cities, currentSlug, className }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(currentSlug);
  const [sheetOpen, setSheetOpen] = useState(false);

  const items = useMemo(
    () => Object.fromEntries(cities.map((c) => [c.slug, c.name])),
    [cities]
  );

  const currentName = items[value] ?? "Город";

  useEffect(() => {
    setValue(currentSlug);
  }, [currentSlug]);

  const onChange = (next: string | null) => {
    if (!next || next === value || pending) return;
    const prev = value;
    setValue(next);
    setSheetOpen(false);
    startTransition(async () => {
      const res = await selectCity(next);
      if (res.error) {
        setValue(prev);
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className={cn("inline-flex min-w-0 shrink items-center", className)}>
      {/* Mobile: top sheet */}
      <div className="lg:hidden">
        <button
          type="button"
          aria-label="Выбор города"
          aria-expanded={sheetOpen}
          disabled={pending}
          onClick={() => setSheetOpen(true)}
          className={cn(
            "inline-flex h-8 w-auto items-center justify-start gap-1.5 rounded-lg border border-border/50",
            "bg-card/40 px-2 text-xs font-medium tracking-tight text-foreground shadow-none backdrop-blur-sm",
            "hover:border-border hover:bg-card/70 dark:bg-card/40 dark:hover:bg-card/70",
            "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
            pending && "opacity-70"
          )}
        >
          <span className="max-w-[6.5rem] truncate">{currentName}</span>
          <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden />
        </button>

        <MobileTopSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title="Город"
          description="Выберите город для каталога квестов"
        >
          {cities.map((c) => {
            const selected = c.slug === value;
            return (
              <button
                key={c.slug}
                type="button"
                disabled={pending}
                onClick={() => onChange(c.slug)}
                className={cn(
                  "flex h-12 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-base font-medium transition-colors",
                  selected
                    ? "bg-white/12 text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                  pending && "opacity-70"
                )}
              >
                <span className="truncate">{c.name}</span>
                {selected ? (
                  <Check className="size-4 shrink-0 text-primary" aria-hidden />
                ) : null}
              </button>
            );
          })}
        </MobileTopSheet>
      </div>

      {/* Desktop: select dropdown */}
      <div className="hidden lg:inline-flex">
        <Select
          value={value}
          onValueChange={onChange}
          disabled={pending}
          items={items}
        >
          <SelectTrigger
            size="sm"
            aria-label="Выбор города"
            className={cn(
              "h-8 w-[9.75rem] justify-between gap-1.5 border-border/50 bg-card/40 px-2.5 text-xs font-medium tracking-tight text-foreground shadow-none backdrop-blur-sm",
              "hover:border-border hover:bg-card/70 dark:bg-card/40 dark:hover:bg-card/70",
              "focus-visible:ring-ring/30",
              "*:data-[slot=select-value]:max-w-none *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:truncate",
              pending && "opacity-70"
            )}
          >
            <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden />
            <SelectValue placeholder="Город" />
          </SelectTrigger>
          <SelectContent
            align="start"
            sideOffset={6}
            alignItemWithTrigger={false}
            className={cn(
              "w-(--anchor-width) min-w-(--anchor-width) max-w-(--anchor-width)",
              "rounded-xl border border-border/60 bg-popover/95 p-1 shadow-lg ring-1 ring-foreground/5 backdrop-blur-md"
            )}
          >
            {cities.map((c) => (
              <SelectItem
                key={c.slug}
                value={c.slug}
                className="rounded-lg py-2 pr-8 pl-2.5 text-sm whitespace-nowrap"
              >
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
