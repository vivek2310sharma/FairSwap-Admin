import "server-only";
import { staffAccess } from "@/lib/auth/guard";
import { requestClient } from "@/lib/supabase/server";
import type { AdminClient } from "@/lib/supabase/client";
import { acknowledgementSchema, evidenceSchema, queueInputSchema, queueSchema, ratingsInputSchema,
  type RatingsResult, type RatingsQueue } from "./contract";
import { ratingsEnabled } from "./feature";

export const RATINGS_UNAVAILABLE = "Ratings moderation is unavailable. The Admin feature and Backend staff access must both be enabled with compatible RPCs.";
const uncertain = "Operation not confirmed. Do not resubmit blindly. Retrieve current evidence with a new reason before deciding whether to act again.";
const denied = "Ratings access denied. An eligible administrator or moderator session, MFA and current policy acceptance are required; own trades and reports cannot be moderated.";
type Factory = () => Promise<AdminClient | null>;

function errorMessage(error: { code?: string; message?: string } | null): string {
  if (["PGRST202", "42883", "55000"].includes(error?.code ?? "")) return RATINGS_UNAVAILABLE;
  if (error?.code === "42501") return denied;
  if (["22023", "23505", "PT409", "40001", "40P01", "55P03"].includes(error?.code ?? "")) {
    return "The case may have changed or the action is no longer applicable. Retrieve current evidence before deciding again. No retry was attempted.";
  }
  return uncertain;
}

export async function loadRatingsQueue(input: unknown, factory: Factory = () => requestClient()): Promise<{ queue?: RatingsQueue; error?: string }> {
  if (!ratingsEnabled()) return { error: RATINGS_UNAVAILABLE };
  const parsed = queueInputSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid queue filters or cursor. Return to the first page." };
  try {
    const client = await factory();
    if (!client || !(await staffAccess(client, true, ["administrator", "moderator"])).allowed) return { error: denied };
    const value = parsed.data;
    const result = await client.rpc("admin_ratings_cases", {
      kind: value.kind, status: value.status, before_at: value.before_at ?? null, before_id: value.before_id ?? null,
    }).retry(false);
    if (result.error) return { error: errorMessage(result.error) };
    const page = queueSchema.safeParse(result.data);
    if (!page.success || page.data.items.some(item => item.kind !== value.kind ||
      (value.status === "open" && item.resolved_at !== null) || (value.status === "resolved" && item.resolved_at === null))) return { error: RATINGS_UNAVAILABLE };
    return { queue: page.data };
  } catch { return { error: RATINGS_UNAVAILABLE }; }
}

/** Called only behind adminMutation's origin/release boundary. No pre-read, retry or private table access. */
export async function executeRatings(input: unknown, factory: Factory): Promise<RatingsResult> {
  if (!ratingsEnabled()) return { error: RATINGS_UNAVAILABLE };
  const parsed = ratingsInputSchema.safeParse(input);
  if (!parsed.success) return { error: "Check the case or ticket identifier and enter a valid reason of 3–500 characters." };
  try {
    const client = await factory();
    const access = client && await staffAccess(client, true, ["administrator", "moderator"]);
    if (!client || !access || !access.allowed) return { error: denied };
    const value = parsed.data;
    const result = await client.rpc(value.target === "case" ? "admin_ratings_case" : "admin_ratings_ticket", {
      [value.target === "case" ? "case_id" : "ticket_id"]: value.id, action: value.action, reason: value.reason,
    }).retry(false);
    if (result.error) return { error: errorMessage(result.error) };
    if (value.action === "evidence") {
      const evidence = evidenceSchema.safeParse(result.data);
      if (!evidence.success || (value.target === "case" ? evidence.data.case.id !== value.id : evidence.data.case.support_ticket_id !== value.id)) return { error: uncertain };
      // Defense in depth; the RPC rejects conflict before disclosing any evidence.
      if ([evidence.data.trade.seller_id, evidence.data.trade.buyer_id, evidence.data.case.reporter_id].includes(access.userId)) return { error: denied };
      return { success: true, message: "Evidence access authorized and recorded in the immutable Backend audit trail.", evidence: evidence.data };
    }
    const ack = acknowledgementSchema.safeParse(result.data);
    if (!ack.success || ack.data.action !== value.action || (value.target === "case" && ack.data.case_id !== value.id)) return { error: uncertain };
    return { success: true, message: "Backend acknowledged the action and recorded its audit reason. Retrieve current evidence to review the resulting state." };
  } catch { return { error: uncertain }; }
}
