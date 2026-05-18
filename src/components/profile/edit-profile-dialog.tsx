"use client";

import { useActionState, useState } from "react";

import { updateProfileAction, type UpdateProfileState } from "@/app/actions/profile";
import { FIELD_LIMITS } from "@/lib/field-limits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RuPhoneInput } from "@/components/ui/ru-phone-input";
import { Label } from "@/components/ui/label";

const initialState: UpdateProfileState = {};

type Props = {
  name: string;
  age: number | null;
  phone: string | null;
};

export function EditProfileDialog({ name, age, phone }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Редактировать профиль</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактирование профиля</DialogTitle>
          <DialogDescription>Обновите имя, возраст и номер телефона.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Имя</Label>
            <Input id="name" name="name" defaultValue={name} required maxLength={FIELD_LIMITS.name.max} />
            {state?.fieldErrors?.name?.[0] && (
              <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Телефон</Label>
            <RuPhoneInput id="phone" key={phone ?? "empty"} defaultValue={phone} />
            {state?.fieldErrors?.phone?.[0] && (
              <p className="text-xs text-destructive">{state.fieldErrors.phone[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="age">Возраст</Label>
            <Input id="age" name="age" type="number" min={1} max={120} defaultValue={age ?? ""} />
            {state?.fieldErrors?.age?.[0] && (
              <p className="text-xs text-destructive">{state.fieldErrors.age[0]}</p>
            )}
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state?.success && <p className="text-sm text-primary">Сохранено. Можно закрыть окно.</p>}
          <DialogFooter className="border-t-0 bg-transparent p-0 pt-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Сохраняем..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

