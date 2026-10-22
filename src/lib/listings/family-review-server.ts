import "server-only";
import { z } from "zod";
import { readAuthConfig } from "@/lib/auth/runtime-config";
import type { AdminClient } from "@/lib/supabase/client";

export const familyReviewPacketSchema = z.object({
  identity:z.object({id:z.string().uuid(),revision:z.number().int().positive(),status:z.literal("pending_review")}).strict(),
  family:z.enum(["two-wheelers","cars","property"]),
  title:z.string().min(3).max(150),
  description:z.string().nullable(),
  category_id:z.string().uuid(),
  city_id:z.string().uuid(),
  locality_id:z.string().uuid().nullable(),
  condition:z.string().nullable(),
  price_type:z.string().nullable(),
  price_paise:z.number().int().nullable(),
  attributes:z.record(z.unknown()),
  details:z.object({}).passthrough(),
  media:z.array(z.object({id:z.string().uuid(),status:z.enum(["uploading","processing","ready","failed"]),display_order:z.number().int()}).strict()).max(8),
  cover_photo_id:z.string().uuid().nullable(),
  fingerprint:z.string().regex(/^[0-9a-f]{64}$/),
}).strict();
export type FamilyReviewPacket=z.infer<typeof familyReviewPacketSchema>;

export function isFamilyReviewEnabled():boolean{
  const config=readAuthConfig();
  if(!config)return false;
  if(config.environment==="production"){
    return process.env.VERCEL_ENV==="production"
      && process.env.FAIRSWAP_PRODUCTION_FAMILY_REVIEW_VERIFIED==="kriuhwppxgxsyyrbjsau";
  }
  return config.environment==="test"
    && process.env.FAIRSWAP_TEST_FAMILY_REVIEW_VERIFIED==="wpppxlnbzqynvhpeuavd"
    && process.env.VERCEL_ENV!=="production";
}

/** Staff authorization/MFA/owner checks are repeated by the production DB RPC. */
export async function loadStaffFamilyReviewPacket(client:AdminClient,listingId:string):Promise<FamilyReviewPacket|null>{
  if(!isFamilyReviewEnabled()||!z.string().uuid().safeParse(listingId).success)return null;
  const {data,error}=await client.rpc("get_staff_family_review",{listing_id:listingId});
  if(error)return null;
  const parsed=familyReviewPacketSchema.safeParse(data);
  return parsed.success && parsed.data.identity.id===listingId ? parsed.data:null;
}
