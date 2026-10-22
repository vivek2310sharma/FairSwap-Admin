import { z } from "zod";

/** Safe review capability parser for the stored category relation.
 * Treat a missing, malformed or multiple relation as unverified, never Goods.
 * Category metadata is a hint for UI; database guards enforce transitions. */
const family = z.object({
  macro_category: z.enum(["goods", "vehicles", "property"]).nullable(),
}).passthrough();
const oneRelation = z.union([family, z.tuple([family])]);

export type ReviewAvailability =
  | { status: "supported"; family: "goods" | null }
  | { status: "not_released"; family: "vehicles" | "property" }
  | { status: "unverified" };

export function moderationReviewAvailability(value: unknown): ReviewAvailability {
  const parsed = oneRelation.safeParse(value);
  if (!parsed.success) return { status: "unverified" };
  const found = Array.isArray(parsed.data) ? parsed.data[0] : parsed.data;
  if (found.macro_category === "vehicles" || found.macro_category === "property") {
    return { status: "not_released", family: found.macro_category };
  }
  return { status: "supported", family: found.macro_category };
}
