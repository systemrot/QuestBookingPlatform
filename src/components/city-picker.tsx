"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { MapPin } from "lucide-react";
import { toast } from "sonner";

import { selectCity } from "@/app/actions/city";
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

  const items = useMemo(
    () => Object.fromEntries(cities.map((c) => [c.slug, c.name])),
    [cities]
  );

  useEffect(() => {
    setValue(currentSlug);
  }, [currentSlug]);

  const onChange = (next: string | null) => {
    if (!next || next === value || pending) return;
    const prev = value;
    setValue(next);
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
    <div className={cn("inline-flex items-center", className)}>
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
            "h-8 w-[9.75rem] gap-1.5 border-border/50 bg-card/40 px-2.5 text-xs font-medium tracking-tight text-foreground shadow-none backdrop-blur-sm",
            "hover:border-border hover:bg-card/70 dark:bg-card/40 dark:hover:bg-card/70",
            "focus-visible:ring-ring/30",
            pending && "opacity-70"
          )}
        >
          <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden />
          <SelectValue placeholder="Город" />
        </SelectTrigger>
        <SelectContent
          align="start"
          sideOffset={6}
          className="rounded-xl border border-border/60 bg-popover/95 p-1 shadow-lg ring-1 ring-foreground/5 backdrop-blur-md"
        >
          {cities.map((c) => (
            <SelectItem
              key={c.slug}
              value={c.slug}
              className="rounded-lg py-2 pl-2.5 text-sm"
            >
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
