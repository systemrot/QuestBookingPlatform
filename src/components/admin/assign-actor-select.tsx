"use client";

import { useState, useTransition } from "react";

import { assignActorToSlot } from "@/app/actions/admin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ActorOption = {
  id: string;
  name: string;
};

type Props = {
  slotId: string;
  actors: ActorOption[];
  currentActorId: string | null;
};

export function AssignActorSelect({ slotId, actors, currentActorId }: Props) {
  const [value, setValue] = useState(currentActorId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-1">
      <Select
        value={value}
        itemToStringLabel={(id) => actors.find((a) => a.id === id)?.name ?? id}
        onValueChange={(next) => {
          if (!next) return;
          setValue(next);
          setError(null);
          startTransition(async () => {
            const result = await assignActorToSlot(next, slotId);
            if ("error" in result && result.error) {
              setError(result.error);
            }
          });
        }}
      >
        <SelectTrigger className="w-48" disabled={isPending}>
          <SelectValue placeholder="Назначить актера" />
        </SelectTrigger>
        <SelectContent>
          {actors.map((actor) => (
            <SelectItem key={actor.id} value={actor.id}>
              {actor.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

