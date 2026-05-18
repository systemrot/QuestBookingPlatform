"use client";

import { useMemo, useState, useTransition } from "react";
import { X } from "lucide-react";

import { addActorToSlot, removeActorFromSlot } from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type AssignedActor = {
  id: string;
  name: string;
};

type Props = {
  slotId: string;
  actors: ActorOption[];
  assignedActors: AssignedActor[];
};

export function AssignActorsPicker({ slotId, actors, assignedActors }: Props) {
  const [assigned, setAssigned] = useState(assignedActors);
  const [addValue, setAddValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const availableToAdd = useMemo(
    () => actors.filter((actor) => !assigned.some((row) => row.id === actor.id)),
    [actors, assigned],
  );

  const handleAdd = (actorId: string) => {
    const actor = actors.find((row) => row.id === actorId);
    if (!actor) return;

    const previous = assigned;
    setAssigned((rows) => [...rows, { id: actor.id, name: actor.name }]);
    setError(null);
    setAddValue("");

    startTransition(async () => {
      const result = await addActorToSlot(actorId, slotId);
      if ("error" in result && result.error) {
        setAssigned(previous);
        setError(result.error);
      }
    });
  };

  const handleRemove = (actorId: string) => {
    const previous = assigned;
    setAssigned((rows) => rows.filter((row) => row.id !== actorId));
    setError(null);

    startTransition(async () => {
      const result = await removeActorFromSlot(actorId, slotId);
      if ("error" in result && result.error) {
        setAssigned(previous);
        setError(result.error);
      }
    });
  };

  return (
    <div className="min-w-[12rem] space-y-2">
      {assigned.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {assigned.map((actor) => (
            <Badge key={actor.id} variant="secondary" className="gap-1 pr-1">
              {actor.name}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="size-5 shrink-0 rounded-sm hover:bg-background/60"
                disabled={isPending}
                aria-label={`Убрать ${actor.name}`}
                onClick={() => handleRemove(actor.id)}
              >
                <X className="size-3" />
              </Button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Актёры не назначены</p>
      )}

      {availableToAdd.length > 0 ? (
        <Select
          value={addValue}
          itemToStringLabel={(id) => availableToAdd.find((a) => a.id === id)?.name ?? id}
          onValueChange={(next) => {
            if (!next) return;
            handleAdd(next);
          }}
        >
          <SelectTrigger className="w-full max-w-xs" disabled={isPending}>
            <SelectValue placeholder="Добавить актёра" />
          </SelectTrigger>
          <SelectContent>
            {availableToAdd.map((actor) => (
              <SelectItem key={actor.id} value={actor.id}>
                {actor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : assigned.length > 0 ? (
        <p className="text-xs text-muted-foreground">Все актёры уже назначены</p>
      ) : actors.length === 0 ? (
        <p className="text-xs text-muted-foreground">Список актёров пуст</p>
      ) : null}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
