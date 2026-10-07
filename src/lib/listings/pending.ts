import "server-only";
import { z } from "zod";
import { staffAccess, type Denial } from "@/lib/auth/guard";
import { requestClient } from "@/lib/supabase/server";
import type { AdminClient } from "@/lib/supabase/client";

const named = z.object({ name: z.string().max(300) });
const relation = z.union([named, z.array(named).max(1), z.null()]);
const timestamp = z.string().datetime({ offset: true });
export const pendingListingSchema = z.object({
  id: z.string().uuid(), seller_id: z.string().uuid(),
  title: z.string().min(3).max(150), description: z.string().max(5000).nullable(),
  condition: z.enum(["new", "like_new", "good", "fair", "poor"]).nullable(),
  price_type: z.enum(["fixed", "negotiable", "free"]).nullable(),
  price_paise: z.number().int().min(0).max(100000000).nullable(),
  revision: z.number().int().positive(), status: z.literal("pending_review"),
  submitted_at: timestamp.nullable(), created_at: timestamp, updated_at: timestamp,
  categories: relation, cities: relation, localities: relation,
  listing_media: z.array(z.object({
    id: z.string().uuid(), display_order: z.number().int(),
    processing_status: z.enum(["uploading", "processing", "ready", "failed"]),
  })).max(8),
});
export type PendingListing = z.infer<typeof pendingListingSchema> & { sellerName: string | null };
export type PendingQueue =
  | { status: "denied"; reason: Denial }
  | { status: "error" }
  | { status: "ready"; listings: PendingListing[]; hasMore: boolean; profilesUnavailable: boolean };

export const PENDING_SELECT = "id,seller_id,title,description,condition,price_type,price_paise,revision,status,submitted_at,created_at,updated_at,categories(name),cities(name),localities(name),listing_media!listing_media_listing_id_fkey(id,display_order,processing_status)";

/** Uses the same request-scoped staff session for authorization and RLS reads. */
export async function loadPendingQueue(factory: () => Promise<AdminClient | null> = requestClient): Promise<PendingQueue> {
  try {
    const client = await factory();
    if (!client) return { status: "denied", reason: "configuration" };
    const access = await staffAccess(client, true);
    if (!access.allowed) return { status: "denied", reason: access.reason };
    const result = await client.from("listings").select(PENDING_SELECT)
      .eq("status", "pending_review")
      .order("submitted_at", { ascending: true, nullsFirst: false })
      .order("id", { ascending: true }).limit(101);
    const parsed = z.array(pendingListingSchema).max(101).safeParse(result.data);
    if (result.error || !parsed.success) return { status: "error" };
    const listings = parsed.data.slice(0, 100);
    const names = new Map<string, string>();
    let profilesUnavailable = false;
    if (listings.length) {
      try {
        const profiles = await client.from("profiles").select("id,display_name")
          .in("id", [...new Set(listings.map((listing) => listing.seller_id))]);
        const valid = z.array(z.object({ id: z.string().uuid(), display_name: z.string().max(300) })).max(100).safeParse(profiles.data);
        if (profiles.error || !valid.success) profilesUnavailable = true;
        else valid.data.forEach((profile) => names.set(profile.id, profile.display_name));
      } catch { profilesUnavailable = true; }
    }
    return { status: "ready", hasMore: parsed.data.length > 100, profilesUnavailable,
      listings: listings.map((listing) => ({ ...listing,
        listing_media: [...listing.listing_media].sort((a, b) => a.display_order - b.display_order),
        sellerName: names.get(listing.seller_id) ?? null,
      })) };
  } catch { return { status: "error" }; }
}

export function relationName(value: z.infer<typeof relation>) {
  return Array.isArray(value) ? value[0]?.name : value?.name;
}
