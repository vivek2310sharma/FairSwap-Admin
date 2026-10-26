"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { adminMutation } from "@/lib/admin/mutations";
import { ratingsInputSchema, type RatingsResult } from "@/lib/admin/ratings/contract";

export async function ratingsAction(input: unknown): Promise<RatingsResult> {
  try {
    const h = await headers();
    const parsed = ratingsInputSchema.safeParse(input);
    if (!parsed.success) return { error: "Enter a valid identifier, action and reason of 3–500 characters." };
    const result = await adminMutation(parsed.data, h.get("origin"), h.get("host"));
    if (result.success && parsed.data.action !== "evidence") {
      // A cache failure must never turn an acknowledged action into a retry request.
      try { revalidatePath("/admin/ratings"); } catch { return { ...result, message: "Action acknowledged and audited. Reload the queue to see current metadata." }; }
    }
    return result;
  } catch { return { error: "Operation not confirmed. Retrieve current evidence before deciding whether to try again." }; }
}
