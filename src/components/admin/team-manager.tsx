"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { grantAdminByEmail, setStaffRole } from "@/app/actions/owner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AppRole } from "@/lib/roles";

export type TeamMemberRow = {
  id: string;
  name: string;
  email: string;
  role: Exclude<AppRole, "USER">;
};

type Props = {
  currentUserId: string;
  members: TeamMemberRow[];
};

const ROLE_LABEL: Record<Exclude<AppRole, "USER">, string> = {
  ADMIN: "Администратор",
  OWNER: "Владелец",
};

type ConfirmState =
  | { kind: "grant"; email: string }
  | { kind: "revoke"; member: TeamMemberRow };

export function TeamManager({ currentUserId, members }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const closeConfirm = () => {
    if (pending) return;
    setConfirm(null);
  };

  const openGrantConfirm = () => {
    const value = email.trim().toLowerCase();
    if (!value || !value.includes("@")) {
      toast.error("Укажите корректный email");
      return;
    }
    setConfirm({ kind: "grant", email: value });
  };

  const runConfirm = () => {
    if (!confirm) return;

    if (confirm.kind === "grant") {
      const grantEmail = confirm.email;
      startTransition(async () => {
        const res = await grantAdminByEmail(grantEmail);
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success(`${res.name} теперь администратор`);
        setEmail("");
        setConfirm(null);
        router.refresh();
      });
      return;
    }

    const member = confirm.member;
    startTransition(async () => {
      const res = await setStaffRole({ userId: member.id, role: "USER" });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`У ${member.name} сняты права администратора`);
      setConfirm(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      <form
        className="flex max-w-xl flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          openGrantConfirm();
        }}
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="grant-admin-email">Выдать админку по email</Label>
          <Input
            id="grant-admin-email"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            disabled={pending}
          />
        </div>
        <Button type="submit" disabled={pending} className="shrink-0">
          Сделать админом
        </Button>
      </form>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Текущая команда
        </h2>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Пока никого нет — добавьте администратора по email выше.
          </p>
        ) : (
          <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
            {members.map((m) => {
              const isSelf = m.id === currentUserId;
              return (
                <li
                  key={m.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{m.name}</p>
                      <Badge variant="secondary">{ROLE_LABEL[m.role]}</Badge>
                      {isSelf ? (
                        <span className="text-xs text-muted-foreground">
                          вы
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {m.email}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {m.role === "ADMIN" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => setConfirm({ kind: "revoke", member: m })}
                      >
                        Забрать админку
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Нельзя изменить
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) closeConfirm();
        }}
      >
        <DialogContent showCloseButton={!pending} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirm?.kind === "revoke"
                ? "Забрать права администратора?"
                : "Выдать права администратора?"}
            </DialogTitle>
            <DialogDescription>
              {confirm?.kind === "grant"
                ? "Пользователь получит доступ в админку: расписание, отчёты и сообщения."
                : "У аккаунта останется обычный доступ клиента, без входа в админку."}
            </DialogDescription>
          </DialogHeader>
          {confirm?.kind === "grant" ? (
            <p className="rounded-lg border border-border/70 bg-muted/40 px-3 py-2 font-medium break-all">
              {confirm.email}
            </p>
          ) : null}
          {confirm?.kind === "revoke" ? (
            <div className="rounded-lg border border-border/70 bg-muted/40 px-3 py-2">
              <p className="font-medium">{confirm.member.name}</p>
              <p className="text-sm text-muted-foreground break-all">
                {confirm.member.email}
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={closeConfirm}
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant={confirm?.kind === "revoke" ? "destructive" : "default"}
              disabled={pending}
              onClick={runConfirm}
            >
              {pending
                ? "Сохраняем…"
                : confirm?.kind === "revoke"
                  ? "Да, забрать права"
                  : "Да, сделать админом"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
