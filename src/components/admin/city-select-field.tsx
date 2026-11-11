"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type CityOption = {
  id: string;
  name: string;
};

type Props = {
  cities: CityOption[];
  value: string;
  onChange: (cityId: string) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
};

export function CitySelectField({
  cities,
  value,
  onChange,
  disabled,
  id,
  className,
}: Props) {
  const items = Object.fromEntries(cities.map((c) => [c.id, c.name]));

  return (
    <Select
      value={value || null}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
      disabled={disabled}
      items={items}
    >
      <SelectTrigger
        id={id}
        size="sm"
        className={cn(
          "h-8 w-full justify-between border-input bg-transparent px-2.5 text-sm shadow-none dark:bg-input/30",
          className
        )}
      >
        <SelectValue placeholder="Выберите город" />
      </SelectTrigger>
      <SelectContent
        align="start"
        sideOffset={4}
        alignItemWithTrigger
        className="w-(--anchor-width) rounded-xl border border-border/60 bg-popover/95 p-1 shadow-lg ring-1 ring-foreground/5 backdrop-blur-md"
      >
        {cities.map((c) => (
          <SelectItem
            key={c.id}
            value={c.id}
            className="rounded-lg py-2 pl-2.5 text-sm"
          >
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
