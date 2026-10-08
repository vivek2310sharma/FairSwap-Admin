"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RefreshQueue() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button className="queue-refresh" disabled={pending} onClick={() => startTransition(() => router.refresh())}>
    {pending ? "Refreshing…" : "Refresh queue"}
  </button>;
}
