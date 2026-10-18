import "server-only";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
const profile = z.object({ id: z.string().uuid(), display_name: z.string().max(300) });
const account = z.object({ user_id: z.string().uuid(), account_status: z.enum(["active", "suspended", "deletion_pending", "deleted"]) });

/** Caller is the page's guarded staff client. Each read independently remains subject to existing RLS. */
export async function loadSupportUser(client: SupabaseClient<Database>, userId: string | null) {
  const unavailable = { profile: null, accountStatus: null };
  if (!userId || !z.string().uuid().safeParse(userId).success) return unavailable;
  const [profileResult, accountResult] = await Promise.allSettled([
    client.from("profiles").select("id,display_name").eq("id",userId).maybeSingle(),
    client.from("user_accounts").select("user_id,account_status").eq("user_id",userId).maybeSingle(),
  ]);
  const p = profileResult.status === "fulfilled" && !profileResult.value.error ? profile.safeParse(profileResult.value.data) : null;
  const a = accountResult.status === "fulfilled" && !accountResult.value.error ? account.safeParse(accountResult.value.data) : null;
  return { profile: p?.success && p.data.id === userId ? p.data : null,
    accountStatus: a?.success && a.data.user_id === userId ? a.data.account_status : null };
}

export function reconcileListingCounts(
  counts: Record<string, number | null>,
  rlsVisibleTotal: number | null,
  rpcTotalCount: number
): { isFullyReconciled: boolean; otherCount: number | null } {
  const exactCountsAvailable = Object.values(counts).every((c) => c !== null);
  const categorySum = exactCountsAvailable
    ? Object.values(counts).reduce((acc: number, val) => acc + (val as number), 0)
    : null;

  const isFullyReconciled =
    exactCountsAvailable &&
    rlsVisibleTotal !== null &&
    rlsVisibleTotal === rpcTotalCount &&
    categorySum !== null &&
    categorySum <= rlsVisibleTotal;

  const otherCount = isFullyReconciled ? rlsVisibleTotal! - categorySum! : null;

  return { isFullyReconciled, otherCount };
}
