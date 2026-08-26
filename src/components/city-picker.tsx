"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { ChevronDown, MapPin } from "lucide-react";
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

function subscribeDesktop(onChange: () => void) {
  const mq = window.matchMedia("(min-width: 640px)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useIsDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia("(min-width: 640px)").matches,
    () => true
  );
}

export function CityPicker({ cities, currentSlug, className }: Props) {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(currentSlug);
  const [open, setOpen] = useState(false);

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
    <div className={cn("inline-flex min-w-0 shrink items-center", className)}>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={pending}
        items={items}
        open={open}
        onOpenChange={setOpen}
      >
        <SelectTrigger
          size="sm"
          aria-label="Выбор города"
          className={cn(
            "h-8 gap-1.5 border-border/50 bg-card/40 text-xs font-medium tracking-tight text-foreground shadow-none backdrop-blur-sm",
            "hover:border-border hover:bg-card/70 dark:bg-card/40 dark:hover:bg-card/70",
            "focus-visible:ring-ring/30",
            "*:data-[slot=select-value]:truncate",
            isDesktop
              ? "w-[9.75rem] justify-between px-2.5 *:data-[slot=select-value]:flex-1"
              : "w-auto justify-start px-2 [&>svg:last-child]:hidden *:data-[slot=select-value]:max-w-[6.5rem] *:data-[slot=select-value]:flex-none",
            pending && "opacity-70"
          )}
        >
          {isDesktop ? (
            <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden />
          ) : null}
          <SelectValue placeholder="Город" className="flex-none" />
          {!isDesktop ? (
            open ? (
              <ChevronDown
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden
              />
            ) : (
              <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden />
            )
          ) : null}
        </SelectTrigger>
        <SelectContent
          align="start"
          sideOffset={6}
          alignItemWithTrigger={isDesktop}
          className={cn(
            "rounded-xl border border-border/60 bg-popover/95 p-1 shadow-lg ring-1 ring-foreground/5 backdrop-blur-md",
            isDesktop
              ? "w-(--anchor-width) min-w-(--anchor-width)"
              : "w-fit min-w-[var(--anchor-width)]"
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
  );
}
