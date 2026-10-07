"use server";
import { z } from "zod";
import { headers } from "next/headers";
import { sameOriginMutation } from "@/lib/auth/inputs";
import { requestClient } from "@/lib/supabase/server";
import { staffAccess } from "@/lib/auth/guard";
import type { AdminResult } from "@/lib/admin/mutations";
/** No deletion phase starts until a separately authorized staff-scoped orchestration capability exists. */
export async function processAccountDeletionAction(requestId: string): Promise<AdminResult> {
  const h = await headers();
  if (!sameOriginMutation(h.get("origin"),h.get("host")) || !z.string().uuid().safeParse(requestId).success) return { error: "Request rejected." };
  try {
    const client = await requestClient();
    if (!client || !(await staffAccess(client,true,["administrator"])).allowed) return { error: "Administrator MFA session required." };
    return { error: "Account deletion is unavailable: the source requires an elevated Storage/Auth orchestrator. No deletion was started." };
  } catch { return { error: "Operation unavailable. No deletion was started." }; }
}
