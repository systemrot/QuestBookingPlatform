"use client";

import * as React from "react";

import { syncClientPendingHold } from "@/lib/pending-hold-client";

/** Пишет/сбрасывает sessionStorage по данным с сервера (без лишнего RTT). */
export function SyncPendingHold({
  expiresAtIso,
}: {
  expiresAtIso: string | null;
}) {
  React.useEffect(() => {
    syncClientPendingHold(expiresAtIso);
  }, [expiresAtIso]);

  return null;
}
