import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
const context=z.object({brand_name:z.string(),model_name:z.string(),storage:z.string(),ram:z.string().nullable(),included:z.array(z.string()),warranty_until:z.string().nullable()});
export async function MobileReviewEvidence({client,listingId}:{client:SupabaseClient;listingId:string}) {
 const r=await client.from("listing_mobile_contexts").select("brand_name,model_name,storage,ram,included,warranty_until").eq("listing_id",listingId).maybeSingle();
 if(r.error)throw new Error("Mobile review evidence unavailable.");if(!r.data)return null;
 const details=context.parse(r.data);const flags=await client.from("listing_phone_risk_flags").select("signal").eq("listing_id",listingId);
 const signals=z.array(z.object({signal:z.string()})).parse(flags.data);
 return <section className="space-y-3 rounded-lg border border-amber-200 bg-white p-5"><h2 className="font-semibold">Phone review evidence</h2><p>{details.brand_name} · {details.model_name} · {details.storage}{details.ram?` · ${details.ram} RAM`:""} · Pickup only</p><p>Included (seller-declared): {details.included.join(", ")||"None declared"}{details.warranty_until?` · Warranty expiry: ${details.warranty_until.slice(0,7)}`:""}</p><p>FairSwap has not verified ownership, authenticity, IMEI or warranty.</p><ul>{signals.map(f=><li key={f.signal}>Moderation signal: {f.signal.replaceAll("_"," ")}</li>)}</ul></section>;
}
