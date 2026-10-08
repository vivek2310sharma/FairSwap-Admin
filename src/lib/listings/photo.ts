import "server-only";
import { z } from "zod";
import { staffAccess } from "@/lib/auth/guard";
import { requestClient } from "@/lib/supabase/server";
import { PRIVATE_CACHE, type AdminClient } from "@/lib/supabase/client";

const ids = z.object({ listingId: z.string().uuid(), mediaId: z.string().uuid() }).strict();
const mediaSchema = z.object({
  id: z.string().uuid(), listing_id: z.string().uuid(), processing_status: z.literal("ready"),
  medium_storage_path: z.string().min(1).max(1024),
});
const headers = { "Cache-Control": PRIVATE_CACHE, Pragma: "no-cache", Expires: "0", "X-Content-Type-Options": "nosniff" };
const unavailable = (status: number) => new Response("Photo unavailable for this session.", { status, headers });

/** Derivative-only byte delivery, with staff-session RLS; no signer or elevated key. */
export async function readListingPhoto(input: unknown, factory: () => Promise<AdminClient | null> = requestClient): Promise<Response> {
  const params = ids.safeParse(input);
  if (!params.success) return unavailable(400);
  try {
    const client = await factory();
    if (!client) return unavailable(403);
    const access = await staffAccess(client, true);
    if (!access.allowed) return unavailable(403);
    const { listingId, mediaId } = params.data;
    const listing = await client.from("listings").select("id,status")
      .eq("id", listingId).eq("status", "pending_review").maybeSingle();
    if (listing.error || listing.data?.id !== listingId || listing.data?.status !== "pending_review") return unavailable(404);
    const result = await client.from("listing_media").select("id,listing_id,processing_status,medium_storage_path")
      .eq("id", mediaId).eq("listing_id", listingId).eq("processing_status", "ready").maybeSingle();
    const media = mediaSchema.safeParse(result.data);
    if (result.error || !media.success || media.data.id !== mediaId || media.data.listing_id !== listingId) return unavailable(404);
    const path = media.data.medium_storage_path;
    if (path.startsWith("/") || /[\\?#\x00-\x1f]/.test(path) || path.split("/").some((segment) => !segment || segment === "." || segment === "..")) return unavailable(404);
    // Existing private Storage policies may deny this read. Never fall back to service_role.
    const photo = await client.storage.from("listing-derivatives").download(path);
    if (photo.error || !photo.data) return unavailable(503);
    if (!["image/jpeg", "image/png", "image/webp"].includes(photo.data.type) || photo.data.size === 0 || photo.data.size > 5242880) return unavailable(503);
    return new Response(photo.data, { headers: { ...headers, "Content-Type": photo.data.type } });
  } catch { return unavailable(503); }
}
